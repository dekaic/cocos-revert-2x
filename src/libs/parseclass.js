const js = require("./js");
const CCObject = require("./objs/CCObject");
const ParserTools = require("./parsertool");
const ValueTypes = require("./value-types");

const SUPPORT_MIN_FORMAT_VERSION = 1;
const EMPTY_PLACEHOLDER = 0;

const MASK_CLASS_INDEX = 0;
const CLASS_TYPE_INDEX = 0;
const CLASS_KEYS_INDEX = 1;
const CLASS_PROP_TYPE_OFFSET_INDEX = 2;

const CUSTOM_OBJ_DATA_CLASS_INDEX = 0;
const CUSTOM_OBJ_DATA_CONTENT_INDEX = 1;

const DICT_LAYOUT_INDEX = 0;
const PACKED_SECTIONS_INDEX = 5;

const OBJ_DATA_MASK_INDEX = 0;
const ARRAY_ITEM_VALUES_INDEX = 0;
const VALUE_TYPE_SETTER_INDEX = 0;

class FileInfo {
    constructor(version) {
        this.preprocessed = true;
        this.version = version;
    }
}

function getMissingClass(classFinder, classId) {
    if (!classFinder) {
        deserialize.reportMissingClass(classId);
    }
    return Object;
}

function doLookupClass(lookupFn, classId, targetArray, targetIndex, allowLazy, classFinder) {
    let cls = lookupFn(classId);

    if (!cls) {
        if (allowLazy) {
            targetArray[targetIndex] = function lazyCreator() {
                const resolved = lookupFn(classId) || getMissingClass(classFinder, classId);
                return new (targetArray[targetIndex] = resolved)();
            };
            return;
        }

        cls = getMissingClass(classFinder, classId);
    }

    targetArray[targetIndex] = cls;
}

function lookupClasses(data, allowLazy, classFinder) {
    const lookupFn = classFinder || js._getClassById;
    const classes = data[3];

    for (let index = 0; index < classes.length; index += 1) {
        const entry = classes[index];

        if (typeof entry === "string") {
            doLookupClass(lookupFn, entry, classes, index, allowLazy, classFinder);
        } else {
            doLookupClass(lookupFn, entry[CLASS_TYPE_INDEX], entry, CLASS_TYPE_INDEX, allowLazy, classFinder);
        }
    }
}

function cacheMasks(data) {
    const masks = data[4];
    if (!masks) return;

    const classes = data[3];
    for (let index = 0; index < masks.length; index += 1) {
        const mask = masks[index];
        mask[MASK_CLASS_INDEX] = classes[mask[MASK_CLASS_INDEX]];
    }
}

class Details {
    constructor() {
        this.uuidObjList = null;
        this.uuidPropList = null;
        this.uuidList = null;
    }

    init(data) {
        this.uuidObjList = data[8];
        this.uuidPropList = data[9];
        this.uuidList = data[10];
    }

    reset() {
        this.uuidList = null;
        this.uuidObjList = null;
        this.uuidPropList = null;
    }

    push(obj, prop, uuid) {
        this.uuidObjList.push(obj);
        this.uuidPropList.push(prop);
        this.uuidList.push(uuid);
    }
}

Details.pool = new js.Pool((details) => {
    details.reset();
}, 5);

Details.pool.get = function get() {
    return this._get() || new Details();
};

function parseInstances(data) {
    const instances = data[5];
    const extra = data[6];
    const extraCount = extra === EMPTY_PLACEHOLDER ? 0 : extra.length;

    let rootIndex = instances[instances.length - 1];
    let instanceCount = instances.length - extraCount;

    if (typeof rootIndex !== "number") {
        rootIndex = 0;
    } else {
        if (rootIndex < 0) {
            rootIndex = ~rootIndex;
        }
        instanceCount -= 1;
    }

    let index = 0;
    for (; index < instanceCount; index += 1) {
        instances[index] = deserializeCCObject(data, instances[index]);
    }

    const classes = data[3];
    for (let extraIndex = 0; extraIndex < extraCount; extraIndex += 1, index += 1) {
        let typeOrAssignment = extra[extraIndex];
        const raw = instances[index];

        if (typeOrAssignment >= 0) {
            const expectedType = classes[typeOrAssignment];
            instances[index] = deserializeCustomCCObject(data, expectedType, raw);
        } else {
            typeOrAssignment = ~typeOrAssignment;
            ASSIGNMENTS[typeOrAssignment](data, instances, index, raw);
        }
    }

    return rootIndex;
}

function assignSimple(_context, target, key, value) {
    target[key] = value;
}

function assignInstanceRef(context, target, key, value) {
    if (value >= 0) {
        target[key] = context[5][value];
    } else {
        context[7][3 * ~value] = target;
    }
}

function genArrayParser(parser) {
    return function parseArrayValues(context, target, key, values) {
        target[key] = values;
        for (let index = 0; index < values.length; index += 1) {
            parser(context, values, index, values[index]);
        }
    };
}

function parseAssetRefByInnerObj(context, target, key, value) {
    target[key] = null;
    context[8][value] = target;
}

function parseClass(context, target, key, value) {
    target[key] = deserializeCCObject(context, value);
}

function parseCustomClass(context, target, key, value) {
    const expectedType = context[3][value[CUSTOM_OBJ_DATA_CLASS_INDEX]];
    target[key] = deserializeCustomCCObject(context, expectedType, value[CUSTOM_OBJ_DATA_CONTENT_INDEX]);
}

function setQuatOrVec4(target, values) {
    target.__cid__ = "cc.Quat";
    target.x = values[1];
    target.y = values[2];
    target.z = values[3];
    target.w = values[4];
}

const BuiltinValueTypeSetters = [
    function setVec2(target, values) {
        target.__cid__ = "cc.Vec2";
        target.x = values[1];
        target.y = values[2];
    },
    function setVec3(target, values) {
        target.__cid__ = "cc.Vec3";
        target.x = values[1];
        target.y = values[2];
        target.z = values[3];
    },
    setQuatOrVec4,
    setQuatOrVec4,
    function setColor(target, values) {
        target._val = values[1];
        target.__cid__ = "cc.Color";
    },
    function setSize(target, values) {
        target.__cid__ = "cc.Size";
        target.width = values[1];
        target.height = values[2];
    },
    function setRect(target, values) {
        target.__cid__ = "cc.Rect";
        target.x = values[1];
        target.y = values[2];
        target.width = values[3];
        target.height = values[4];
    },
    function setMat4(target, values) {
        target.__cid__ = "TypedArray";
        target.ctor = "Float64Array";
        ValueTypes.Mat4.fromArray(target, values, 1);
    },
];

const BuiltinValueTypes = [
    ValueTypes.Vec2,
    ValueTypes.Vec3,
    ValueTypes.Vec4,
    ValueTypes.Quat,
    ValueTypes.Color,
    ValueTypes.Size,
    ValueTypes.Rect,
    ValueTypes.Mat4,
];

function parseValueTypeCreated(_context, target, key, value) {
    const instance = new BuiltinValueTypes[value[VALUE_TYPE_SETTER_INDEX]]();
    BuiltinValueTypeSetters[value[VALUE_TYPE_SETTER_INDEX]](instance, value);
    target[key] = instance;
}

function parseValueType(_context, target, key, value) {
    const instance = new BuiltinValueTypes[value[VALUE_TYPE_SETTER_INDEX]]();
    BuiltinValueTypeSetters[value[VALUE_TYPE_SETTER_INDEX]](instance, value);
    target[key] = instance;
}

function parseTRS(_context, target, key, value) {
    const existing = target[key];
    if (existing) {
        existing.set(value);
    } else {
        target[key] = { _trs: value, __cid__: "TypedArray" };
    }
}

function parseDict(context, target, key, value) {
    const layout = value[DICT_LAYOUT_INDEX];
    target[key] = layout;

    for (let index = DICT_LAYOUT_INDEX + 1; index < value.length; index += 3) {
        const dictKey = value[index];
        const assignmentType = value[index + 1];
        const dictValue = value[index + 2];
        ASSIGNMENTS[assignmentType](context, layout, dictKey, dictValue);
    }
}

function parseArray(context, target, key, value) {
    const values = value[ARRAY_ITEM_VALUES_INDEX];
    target[key] = values;

    for (let index = 0; index < values.length; index += 1) {
        const elementValue = values[index];
        const assignmentType = value[index + 1];
        if (assignmentType !== 0) {
            ASSIGNMENTS[assignmentType](context, values, index, elementValue);
        }
    }
}

const ASSIGNMENTS = new Array(13);

function deserializeCCObject(data, rawData) {
    const mask = data[4][rawData[OBJ_DATA_MASK_INDEX]];
    const classInfo = mask[MASK_CLASS_INDEX];
    const classId = classInfo[CLASS_TYPE_INDEX];

    const obj = {};
    obj.__cid__ = classId;

    const keys = classInfo[CLASS_KEYS_INDEX];
    obj.__values__ = keys;

    const propTypeOffset = classInfo[CLASS_PROP_TYPE_OFFSET_INDEX];
    const simpleEnd = mask[mask.length - 1];

    let maskIndex = MASK_CLASS_INDEX + 1;
    for (; maskIndex < simpleEnd; maskIndex += 1) {
        obj[keys[mask[maskIndex]]] = rawData[maskIndex];
    }

    for (; maskIndex < rawData.length; maskIndex += 1) {
        const propName = keys[mask[maskIndex]];
        const assignmentType = classInfo[mask[maskIndex] + propTypeOffset];
        ASSIGNMENTS[assignmentType](data, obj, propName, rawData[maskIndex]);
    }

    return obj;
}

function deserializeCustomCCObject(data, expectedType, rawData) {
    let obj = new CCObject();

    if (obj._deserialize) {
        obj._deserialize(rawData, data[0]);
    } else if (expectedType === "cc.Texture2D") {
        obj = ParserTools._Texture2D_deserialize(rawData);
    } else {
        obj.__expectedType__ = expectedType;
    }

    return obj;
}

function dereference(refs, instances, keys) {
    const lastIndex = refs.length - 1;
    let cursor = 0;
    const firstSectionEnd = 3 * refs[lastIndex];

    for (; cursor < firstSectionEnd; cursor += 3) {
        const owner = refs[cursor];
        const target = instances[refs[cursor + 2]];
        const keyIndex = refs[cursor + 1];

        if (keyIndex >= 0) {
            owner[keys[keyIndex]] = target;
        } else {
            owner[~keyIndex] = target;
        }
    }

    for (; cursor < lastIndex; cursor += 3) {
        const owner = instances[refs[cursor]];
        const target = instances[refs[cursor + 2]];
        const keyIndex = refs[cursor + 1];

        if (keyIndex >= 0) {
            owner[keys[keyIndex]] = target;
        } else {
            owner[~keyIndex] = target;
        }
    }
}

function parseResult(data) {
    const instances = data[5];
    const keys = data[2];
    const uuids = data[1];

    const uuidObjList = data[8];
    const uuidPropList = data[9];
    const uuidList = data[10];

    for (let index = 0; index < uuidObjList.length; index += 1) {
        let objRef = uuidObjList[index];
        if (typeof objRef === "number") {
            objRef = uuidObjList[index] = instances[objRef];
        }

        let prop = uuidPropList[index];
        if (typeof prop === "number") {
            prop = prop >= 0 ? keys[prop] : ~prop;
            uuidPropList[index] = prop;
        }

        let dependUuid = uuidList[index];
        if (typeof dependUuid === "number") {
            dependUuid = uuidList[index] = uuids[dependUuid];
        }

        objRef[prop] = { _depend_uuid: dependUuid };
    }
}

function deserialize(data, details, options) {
    if (typeof data === "string") {
        data = JSON.parse(data);
    }

    const shouldRecycleDetails = !details;
    details = details || Details.pool.get();
    details.init(data);
    options = options || {};

    let header = data[0];
    let preprocessed = false;
    let version = header;

    if (typeof header === "object") {
        preprocessed = header.preprocessed;
        version = header.version;
    }

    if (version < SUPPORT_MIN_FORMAT_VERSION) {
        throw new Error("不支持的版本 ，错误编码:5304");
    }

    options._version = version;
    options.result = details;
    data[0] = options;

    if (!preprocessed) {
        lookupClasses(data, false, options.classFinder);
        cacheMasks(data);
    }

    const instances = data[5];
    const rootIndex = parseInstances(data);

    if (data[7]) {
        dereference(data[7], instances, data[2]);
    }

    parseResult(data);

    if (shouldRecycleDetails) {
        Details.pool.put(details);
    }

    return instances[rootIndex];
}

function packCustomObjData(classId, content, withLastAssignment) {
    return [
        SUPPORT_MIN_FORMAT_VERSION,
        EMPTY_PLACEHOLDER,
        EMPTY_PLACEHOLDER,
        [classId],
        EMPTY_PLACEHOLDER,
        withLastAssignment ? [content, -1] : [content],
        [0],
        EMPTY_PLACEHOLDER,
        [],
        [],
        [],
    ];
}

function unpackJSONs(data, classFinder) {
    if (data[0] < SUPPORT_MIN_FORMAT_VERSION) {
        throw new Error("不支持的版本 ，错误编码:5304");
    }

    lookupClasses(data, true, classFinder);
    cacheMasks(data);

    const fileInfo = new FileInfo(data[0]);
    const uuidList = data[1];
    const keyList = data[2];
    const classList = data[3];
    const maskList = data[4];
    const packedSections = data[PACKED_SECTIONS_INDEX];

    for (let index = 0; index < packedSections.length; index += 1) {
        if (Array.isArray(packedSections[index])) {
            packedSections[index].unshift(fileInfo, uuidList, keyList, classList, maskList);
        }
    }

    return packedSections;
}

ASSIGNMENTS[0] = assignSimple;
ASSIGNMENTS[1] = assignInstanceRef;
ASSIGNMENTS[2] = genArrayParser(assignInstanceRef);
ASSIGNMENTS[3] = genArrayParser(parseAssetRefByInnerObj);
ASSIGNMENTS[4] = parseClass;
ASSIGNMENTS[5] = parseValueTypeCreated;
ASSIGNMENTS[6] = parseAssetRefByInnerObj;
ASSIGNMENTS[7] = parseTRS;
ASSIGNMENTS[8] = parseValueType;
ASSIGNMENTS[9] = genArrayParser(parseClass);
ASSIGNMENTS[10] = parseCustomClass;
ASSIGNMENTS[11] = parseDict;
ASSIGNMENTS[12] = parseArray;

Object.defineProperty(exports, "__esModule", { value: true });
exports.deserialize = deserialize;
exports.packCustomObjData = packCustomObjData;
exports.unpackJSONs = unpackJSONs;
