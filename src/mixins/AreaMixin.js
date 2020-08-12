import { types, getParent, destroy } from "mobx-state-tree";
import { guidGenerator } from "../core/Helpers";

export const AreaMixin = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
  })
  .views(self => ({
    get completion() {
      return getParent(self, 2);
    },

    get results() {
      return self.completion.results.filter(r => r.area === self);
    },

    get tag() {
      const result = self.results.find(r => r.type.endsWith("labels"));
      return result && result.from_name;
    },

    get object() {
      return self.results[0].to_name;
    },

    get parent() {
      return self.object;
    },

    get style() {
      const styled = self.results.find(r => r.style);
      return styled && styled.style;
    },

    // @todo may be slow, consider to add some code to completion (un)select* methods
    get selected() {
      return self.completion.highlightedNode === self;
    },

    getOneColor() {
      return self.style && self.style.fillcolor;
    },
  }))
  .volatile(self => ({
    // selected: false,
  }))
  .actions(self => ({
    beforeDestroy() {
      self.results.forEach(r => destroy(r));
    },

    setSelected(value) {
      self.selected = value;
    },

    setValue(tag) {
      const result = self.results.find(r => r.from_name === tag);
      if (result) {
        result.setValue(tag.selectedValues());
      } else {
        self.completion.createJustResult({
          area: self,
          from_name: tag,
          to_name: self.object,
          type: tag.type,
          value: {
            [tag.type]: tag.selectedValues(),
          },
        });
      }
      self.updateAppearenceFromState && self.updateAppearenceFromState();
    },
  }));