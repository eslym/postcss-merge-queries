import type { AtRule } from "postcss";

type MediaFeature = {
  property: "width" | "height";
  type: "min" | "max";
  value: number;
  unit: string;
};

function extract_feature(feature: string): MediaFeature | undefined {
  const match = feature.match(
    /\(\s*(min|max)-(width|height)\s*:\s*([0-9]+(?:\.[0-9]+)?)([a-z]+)\s*\)/
  );
  if (!match) {
    return undefined;
  }
  return {
    property: match[2] as "width" | "height",
    type: match[1] as "min" | "max",
    value: parseFloat(match[3]),
    unit: match[4],
  };
}

function compare_media(a: string, b: string) {
  const feature_a = extract_feature(a);
  const feature_b = extract_feature(b);
  if (
    !feature_a ||
    !feature_b ||
    feature_a.property !== feature_b.property ||
    feature_a.type !== feature_b.type ||
    feature_a.unit !== feature_b.unit
  ) {
    return 0;
  }
  return (
    (feature_a.value - feature_b.value) * (feature_a.type === "min" ? 1 : -1)
  );
}

function compare(a: AtRule, b: AtRule) {
  if (a.name !== b.name) {
    return 0;
  }
  switch (a.name) {
    case "media":
    case "container":
      return compare_media(a.params, b.params);
    default:
      return 0;
  }
}

function isSortable(rule: AtRule) {
  switch (rule.name) {
    case "media":
    case "container":
      return /\(\s*(min|max)-(width|height)\s*:\s*([0-9]+(?:\.[0-9]+)?)([a-z]+)\s*\)/.test(
        rule.params
      );
    default:
      return false;
  }
}

/**
 * Simple comparison function for at-rules, only sort the media and
 * container which have min-width, max-width, min-height or max-height.
 */
export const simpleCompare = {
  isSortable,
  compare,
};
