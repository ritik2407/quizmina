// src/common/validation/rule-order.decorator.ts
import 'reflect-metadata';

const RULE_ORDER_KEY = Symbol('rule_order');
const FIELD_ORDER_KEY = Symbol('field_order');

export function RuleOrder(...rules: string[]) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata(RULE_ORDER_KEY, rules, target, propertyKey);
    // also record property declaration order
    const existing: string[] =
      Reflect.getMetadata(FIELD_ORDER_KEY, target.constructor) ?? [];
    if (!existing.includes(propertyKey)) {
      Reflect.defineMetadata(
        FIELD_ORDER_KEY,
        [...existing, propertyKey],
        target.constructor,
      );
    }
  };
}

export function getRuleOrder(
  target: any,
  propertyKey: string,
): string[] | undefined {
  return Reflect.getMetadata(RULE_ORDER_KEY, target, propertyKey);
}

export function getFieldOrder(ctor: Function): string[] | undefined {
  return Reflect.getMetadata(FIELD_ORDER_KEY, ctor);
}
