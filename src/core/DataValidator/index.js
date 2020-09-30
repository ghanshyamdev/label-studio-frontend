import { types } from "mobx-state-tree";
import { ConfigValidator } from "./ConfigValidator";

const VALIDATORS = {
  config: ConfigValidator,
  result: {
    validare() {
      return [];
    },
  },
};

const ValidType = types.union(types.string, types.array(types.string));

export const ValidationError = types
  .model({
    modelName: types.string,
    field: types.string,
    error: types.string,
    value: types.maybeNull(types.string),
    validType: types.maybeNull(ValidType),
  })
  .views(self => ({
    get identifier() {
      return [self.modelName, self.field, self.error, self.value]
        .concat(...[self.validType])
        .filter(el => el !== null)
        .join("-");
    },
  }));

export class DataValidator {
  callbacks = new Set();

  addErrorCallback(callback) {
    if (!this.callbacks.has(callback)) {
      this.callbacks.add(callback);
      return true;
    }
    return false;
  }

  removeErrorCallback(callback) {
    if (this.callbacks.has(callback)) {
      this.callbacks.delete(callback);
      return true;
    }
    return false;
  }

  /**
   * Perform validation and return errors in a form of an array
   * @param {keyof typeof VALIDATORS} validatorName
   * @param {Object} data
   */
  validate(validatorName, data) {
    const validator = VALIDATORS[validatorName];
    let errors = [];

    if (validator) {
      errors = validator.validate(data).map(compiledError => {
        try {
          return ValidationError.create(compiledError);
        } catch (err) {
          console.log({ compiledError });
          throw err;
        }
      });
    } else {
      console.error(`Unknown validator: ${validatorName}`);
    }

    setTimeout(() => {
      if (errors.length) {
        for (let callback of this.callback) {
          callback(errors);
        }
      }
    }, 0);
  }
}