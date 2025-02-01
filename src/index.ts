export { simpleCompare } from "./compare";
import type postcss from "postcss";

type SortQueryFn = (a: postcss.AtRule, b: postcss.AtRule) => number;

/**
 * Type definition for the function used to sort queries.
 */
export type SortQuery =
  | SortQueryFn
  | {
      /**
       * Function to determine if the rule is sortable.
       * @param rule at-rule object
       * @returns is the rule sortable
       */
      isSortable: (rule: postcss.AtRule) => boolean;

      /**
       * Function to compare two at-rules.
       * @param a first at-rule object
       * @param b second at-rule object
       * @returns comparison result
       */
      compare: SortQueryFn;
    }
  | false;

/**
 * Options for the mergeQueries plugin.
 */
export type PluginOptions = {
  /**
   * List of at-rules to merge.
   * @default ["media", "supports", "container"]
   */
  toMerge?: string[];
  /**
   * Function to sort queries or false to disable sorting.
   * @default false
   */
  sortQuery?: SortQuery;
};

type MergedNodes = {
  node: postcss.Container;
  queries: {
    [query: string]: MergedNodes;
  };
  childs: MergedNodes[];
};

const have_nested = new Set(["media", "supports", "container", "layer"]);

/**
 * Recursively walks through the rules and merges specified at-rules.
 */
function walk_rules(
  { node: current, queries, childs }: MergedNodes,
  nodes: postcss.ChildNode[],
  toMerge: Set<string>
) {
  for (const node of nodes) {
    node.remove();
    if (node.type !== "atrule" || !node.nodes) {
      current.append(node);
      continue;
    }
    if (toMerge.has(node.name)) {
      if (!queries[`@${node.name} ${node.params}`]) {
        queries[`@${node.name} ${node.params}`] = {
          node: node,
          queries: {},
          childs: [],
        };
        current.append(node);
      }
      walk_rules(
        queries[`@${node.name} ${node.params}`],
        [...node.nodes],
        toMerge
      );
      continue;
    }
    if (have_nested.has(node.name)) {
      const nested = {
        node: node,
        queries: {},
        childs: [],
      };
      childs.push(nested);
      walk_rules(nested, [...node.nodes], toMerge);
    }
    current.append(node);
  }
}

/**
 * Recursively sorts the rules based on the provided compare function.
 */
function sort_rules(
  { node: current, queries, childs }: MergedNodes,
  compare: SortQueryFn,
  sortable: (rule: postcss.AtRule) => boolean
) {
  const sorted = Object.keys(queries)
    .filter((rule) => sortable(queries[rule].node as postcss.AtRule))
    .sort((a, b) => {
      const a_node = queries[a].node as postcss.AtRule;
      const b_node = queries[b].node as postcss.AtRule;
      return compare(a_node, b_node);
    });
  for (const query of sorted) {
    queries[query].node.remove();
    current.append(queries[query].node);
    sort_rules(queries[query], compare, sortable);
  }
  for (const child of childs) {
    sort_rules(child, compare, sortable);
  }
}

/**
 * PostCSS plugin to merge and optionally sort at-rules.
 * @param options - Options for the plugin.
 * @returns The PostCSS plugin.
 */
export const mergeQueries: postcss.PluginCreator<PluginOptions> = ({
  sortQuery = false,
  toMerge = ["media", "supports", "container"],
} = {}) => {
  return {
    postcssPlugin: "merge-queries",
    /**
     * Processes the PostCSS root node to merge and sort at-rules.
     * @param root - The PostCSS root node.
     */
    Once(root) {
      const to_merge = new Set(toMerge);
      const merged: MergedNodes = { node: root, queries: {}, childs: [] };
      walk_rules(merged, [...root.nodes], to_merge);
      if (sortQuery) {
        const compare =
          typeof sortQuery === "function" ? sortQuery : sortQuery.compare;
        const sortable =
          typeof sortQuery === "function" ? () => true : sortQuery.isSortable;
        sort_rules(merged, compare, sortable);
      }
    },
  };
};

mergeQueries.postcss = true;

export default mergeQueries;
