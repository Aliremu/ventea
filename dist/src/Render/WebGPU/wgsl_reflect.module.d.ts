export let Keyword: {};
/**
 * @author Brendan Duncan / https://github.com/brendan-duncan
 */
export class Token {
    constructor(type: any, lexeme: any, line: any);
    _type: any;
    _lexeme: any;
    _line: any;
    toString(): any;
}
export namespace Token {
    namespace EOF {
        const name: string;
        const type: string;
        const rule: number;
    }
    namespace WgslTokens {
        const decimal_float_literal: RegExp;
        const hex_float_literal: RegExp;
        const int_literal: RegExp;
        const uint_literal: RegExp;
        const ident: RegExp;
        const and: string;
        const and_and: string;
        const arrow: string;
        const attr: string;
        const attr_left: string;
        const attr_right: string;
        const forward_slash: string;
        const bang: string;
        const bracket_left: string;
        const bracket_right: string;
        const brace_left: string;
        const brace_right: string;
        const colon: string;
        const comma: string;
        const equal: string;
        const equal_equal: string;
        const not_equal: string;
        const greater_than: string;
        const greater_than_equal: string;
        const shift_right: string;
        const less_than: string;
        const less_than_equal: string;
        const shift_left: string;
        const modulo: string;
        const minus: string;
        const minus_minus: string;
        const period: string;
        const plus: string;
        const plus_plus: string;
        const or: string;
        const or_or: string;
        const paren_left: string;
        const paren_right: string;
        const semicolon: string;
        const star: string;
        const tilde: string;
        const underscore: string;
        const xor: string;
        const plus_equal: string;
        const minus_equal: string;
        const times_equal: string;
        const division_equal: string;
        const modulo_equal: string;
        const and_equal: string;
        const or_equal: string;
        const xor_equal: string;
        const shift_right_equal: string;
        const shift_left_equal: string;
    }
    const WgslKeywords: string[];
    const WgslReserved: string[];
}
/**
 * @author Brendan Duncan / https://github.com/brendan-duncan
 */
export class WgslParser {
    _tokens: any[];
    _current: number;
    parse(tokensOrCode: any): (Function | Var | Let | Struct | Enable | Alias)[];
    _initialize(tokensOrCode: any): void;
    _error(token: any, message: any): {
        token: any;
        message: any;
        toString: () => string;
    };
    _isAtEnd(): boolean;
    _match(types: any): boolean;
    _consume(types: any, message: any): any;
    _check(types: any): boolean;
    _advance(): any;
    _peek(): any;
    _previous(): any;
    _global_decl_or_directive(): Function | Var | Let | Struct | Enable | Alias | null;
    _function_decl(): Function | null;
    _compound_statement(): any;
    _statement(): any;
    _static_assert_statement(): StaticAssert | null;
    _while_statement(): any;
    _for_statement(): any;
    _for_init(): Var | Let | Const | Assign | Call | null;
    _for_increment(): Increment | Assign | Call | null;
    _variable_statement(): Var | Let | Const | null;
    _increment_decrement_statement(): Increment | null;
    _assignment_statement(): Assign | null;
    _func_call_statement(): Call | null;
    _loop_statement(): any;
    _switch_statement(): any;
    _switch_body(): any;
    _case_selectors(): any[];
    _case_body(): any;
    _if_statement(): any;
    _elseif_statement(): any;
    _return_statement(): Return | null;
    _short_circuit_or_expression(): any;
    _short_circuit_and_expr(): any;
    _inclusive_or_expression(): any;
    _exclusive_or_expression(): any;
    _and_expression(): any;
    _equality_expression(): any;
    _relational_expression(): any;
    _shift_expression(): any;
    _additive_expression(): any;
    _multiplicative_expression(): any;
    _unary_expression(): any;
    _singular_expression(): any;
    _postfix_expression(): any;
    _primary_expression(): any;
    _argument_expression_list(): any;
    _optional_paren_expression(): GroupingExpr;
    _paren_expression(): any;
    _struct_decl(): Struct | null;
    _global_variable_decl(): Var | null;
    _global_constant_decl(): Let | null;
    _const_expression(): any;
    _variable_decl(): Var | null;
    _enable_directive(): Enable;
    _type_alias(): Alias;
    _type_decl(): any;
    _texture_sampler_types(): any;
    _attribute(): Attribute[] | null;
}
/**
 * @author Brendan Duncan / https://github.com/brendan-duncan
 */
export class WgslReflect {
    constructor(code: any);
    initialize(code: any): void;
    ast: (Function | Var | Let | Struct | Enable | Alias)[] | undefined;
    structs: any[] | undefined;
    uniforms: any[] | undefined;
    storage: any[] | undefined;
    textures: any[] | undefined;
    samplers: any[] | undefined;
    functions: any[] | undefined;
    aliases: any[] | undefined;
    entry: {
        vertex: never[];
        fragment: never[];
        compute: never[];
    } | undefined;
    isTextureVar(node: any): boolean;
    isSamplerVar(node: any): boolean;
    isUniformVar(node: any): any;
    isStorageVar(node: any): any;
    _getInputs(args: any, inputs: any): any;
    _getInputInfo(node: any): {
        name: any;
        type: any;
        input: any;
        locationType: any;
        location: any;
    } | null;
    _parseInt(s: any): any;
    getAlias(name: any): any;
    getStruct(name: any): any;
    getAttribute(node: any, name: any): any;
    getBindGroups(): any[];
    getStorageBufferInfo(node: any): {
        group: any;
        binding: any;
        name?: any;
        type?: any;
        align?: number | undefined;
        size?: number | undefined;
        members?: never[] | undefined;
    } | null;
    getStructInfo(node: any): {
        name: any;
        type: any;
        align: number;
        size: number;
        members: never[];
    } | null;
    _getUniformInfo(node: any): {
        name: any;
        type: any;
        align: number;
        size: number;
        members: never[];
    } | null;
    getUniformBufferInfo(node: any): {
        group: any;
        binding: any;
        name?: any;
        type?: any;
        align?: number | undefined;
        size?: number | undefined;
        members?: never[] | undefined;
    } | null;
    getTypeInfo(type: any): {
        align: number;
        size: number;
    } | null | undefined;
    _roundUp(k: any, n: any): number;
}
export namespace WgslReflect {
    namespace TypeInfo {
        namespace i32 {
            const align: number;
            const size: number;
        }
        namespace u32 {
            const align_1: number;
            export { align_1 as align };
            const size_1: number;
            export { size_1 as size };
        }
        namespace f32 {
            const align_2: number;
            export { align_2 as align };
            const size_2: number;
            export { size_2 as size };
        }
        namespace atomic {
            const align_3: number;
            export { align_3 as align };
            const size_3: number;
            export { size_3 as size };
        }
        namespace vec2 {
            const align_4: number;
            export { align_4 as align };
            const size_4: number;
            export { size_4 as size };
        }
        namespace vec3 {
            const align_5: number;
            export { align_5 as align };
            const size_5: number;
            export { size_5 as size };
        }
        namespace vec4 {
            const align_6: number;
            export { align_6 as align };
            const size_6: number;
            export { size_6 as size };
        }
        namespace mat2x2 {
            const align_7: number;
            export { align_7 as align };
            const size_7: number;
            export { size_7 as size };
        }
        namespace mat3x2 {
            const align_8: number;
            export { align_8 as align };
            const size_8: number;
            export { size_8 as size };
        }
        namespace mat4x2 {
            const align_9: number;
            export { align_9 as align };
            const size_9: number;
            export { size_9 as size };
        }
        namespace mat2x3 {
            const align_10: number;
            export { align_10 as align };
            const size_10: number;
            export { size_10 as size };
        }
        namespace mat3x3 {
            const align_11: number;
            export { align_11 as align };
            const size_11: number;
            export { size_11 as size };
        }
        namespace mat4x3 {
            const align_12: number;
            export { align_12 as align };
            const size_12: number;
            export { size_12 as size };
        }
        namespace mat2x4 {
            const align_13: number;
            export { align_13 as align };
            const size_13: number;
            export { size_13 as size };
        }
        namespace mat3x4 {
            const align_14: number;
            export { align_14 as align };
            const size_14: number;
            export { size_14 as size };
        }
        namespace mat4x4 {
            const align_15: number;
            export { align_15 as align };
            const size_15: number;
            export { size_15 as size };
        }
    }
    const TextureTypes: any;
    const SamplerTypes: any;
}
export class WgslScanner {
    constructor(source: any);
    _source: any;
    _tokens: any[];
    _start: number;
    _current: number;
    _line: number;
    scanTokens(): any[];
    scanToken(): boolean;
    _findToken(lexeme: any): any;
    _match(lexeme: any, rule: any): boolean;
    _isAtEnd(): boolean;
    _isWhitespace(c: any): boolean;
    _advance(amount: any): any;
    _peekAhead(offset: any): any;
    _addToken(type: any): void;
}
/**
 * @class Function
 * @extends Statement
 * @category AST
 * @property {String} name
 * @property {Array<Argument>} args
 * @property {Type?} returnType
 * @property {Array<Statement>} body
 */
declare class Function extends Statement {
    constructor(name: any, args: any, returnType: any, body: any);
    name: any;
    args: any;
    returnType: any;
    body: any;
    get astNodeType(): string;
}
/**
 * @class Var
 * @extends Statement
 * @category AST
 * @property {String} name
 * @property {Type?} type
 * @property {String?} storage
 * @property {String?} access
 * @property {Expression?} value
 */
declare class Var extends Statement {
    constructor(name: any, type: any, storage: any, access: any, value: any);
    name: any;
    type: any;
    storage: any;
    access: any;
    value: any;
    get astNodeType(): string;
}
/**
 * @class Let
 * @extends Statement
 * @category AST
 * @property {String} name
 * @property {Type?} type
 * @property {String?} storage
 * @property {String?} access
 * @property {Expression?} value
 */
declare class Let extends Statement {
    constructor(name: any, type: any, storage: any, access: any, value: any);
    name: any;
    type: any;
    storage: any;
    access: any;
    value: any;
    get astNodeType(): string;
}
/**
 * @class Struct
 * @extends Statement
 * @category AST
 * @property {String} name
 * @property {Array<Member>} members
 */
declare class Struct extends Statement {
    constructor(name: any, members: any);
    name: any;
    members: any;
    get astNodeType(): string;
}
/**
 * @class Enable
 * @extends Statement
 * @category AST
 * @property {String} name
 */
declare class Enable extends Statement {
    constructor(name: any);
    name: any;
    get astNodeType(): string;
}
/**
 * @class Alias
 * @extends Statement
 * @category AST
 * @property {String} name
 * @property {Type} type
 */
declare class Alias extends Statement {
    constructor(name: any, type: any);
    name: any;
    type: any;
    get astNodeType(): string;
}
/**
 * @class StaticAssert
 * @extends Statement
 * @category AST
 * @property {Expression} expression
 */
declare class StaticAssert extends Statement {
    constructor(expression: any);
    expression: any;
    get astNodeType(): string;
}
/**
 * @class Const
 * @extends Statement
 * @category AST
 * @property {String} name
 * @property {Type?} type
 * @property {String?} storage
 * @property {String?} access
 * @property {Expression} value
 */
declare class Const extends Statement {
    constructor(name: any, type: any, storage: any, access: any, value: any);
    name: any;
    type: any;
    storage: any;
    access: any;
    value: any;
    get astNodeType(): string;
}
/**
 * @class Assign
 * @extends Statement
 * @category AST
 * @property {AssignOperator} operator
 * @property {String} variable
 * @property {Expression} value
 */
declare class Assign extends Statement {
    constructor(operator: any, variable: any, value: any);
    operator: any;
    variable: any;
    value: any;
    get astNodeType(): string;
}
/**
 * @class Call
 * @extends Statement
 * @category AST
 * @property {String} name
 * @property {Array<Argument>} args
 */
declare class Call extends Statement {
    constructor(name: any, args: any);
    name: any;
    args: any;
    get astNodeType(): string;
}
/**
 * @class Increment
 * @extends Statement
 * @category AST
 * @property {IncrementOperator} operator
 * @property {String} variable
 */
declare class Increment extends Statement {
    constructor(operator: any, variable: any);
    operator: any;
    variable: any;
    get astNodeType(): string;
}
/**
 * @class Return
 * @extends Statement
 * @category AST
 * @property {Expression} value
 */
declare class Return extends Statement {
    constructor(value: any);
    value: any;
    get astNodeType(): string;
}
/**
 * @class GroupingExpr
 * @extends Expression
 * @category AST
 * @property {Array<Expression>} contents
 */
declare class GroupingExpr extends Expression {
    constructor(contents: any);
    contents: any;
    get astNodeType(): string;
}
/**
 * @class Attribute
 * @extends Node
 * @category AST
 * @property {String} name
 * @property {Array<Expression>?} value
 */
declare class Attribute extends Node {
    constructor(name: any, value: any);
    name: any;
    value: any;
    get astNodeType(): string;
}
/**
 * @class Statement
 * @extends Node
 * @category AST
 */
declare class Statement extends Node {
}
/**
 * @class Expression
 * @extends Node
 * @category AST
 */
declare class Expression extends Node {
}
/**
 * @class Node
 * @category AST
 * Base class for AST nodes parsed from a WGSL shader.
 */
declare class Node {
    get isAstNode(): boolean;
}
export {};
