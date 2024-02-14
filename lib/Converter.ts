import * as RDF from "@rdfjs/types";
import {getTermRaw} from "rdf-literal";
import {IBindings, ISettings, SparqlJsonParser} from "sparqljson-parse";

/**
 * Converts SPARQL JSON results to a tree-based structure by splitting variables on a certain delimiter.
 */
export class Converter {

  private readonly delimiter: string;
  private readonly parser: SparqlJsonParser;
  private readonly materializeRdfJsTerms: boolean;

  constructor(settings?: IConverterSettings) {
    settings = settings || { delimiter: '_' };
    settings.prefixVariableQuestionMark = false;
    this.delimiter = settings.delimiter || '_';
    this.parser = new SparqlJsonParser(settings);
    this.materializeRdfJsTerms = settings.materializeRdfJsTerms;
  }

  /**
   * Adds a value to a tree.
   * @param tree A tree datastructure.
   * @param {string[]} path The path of keys in the tree.
   * @param {Term} value A value to add.
   * @param {string} lastKeyPath The accumulated key path (separated by the given delimiter)
   *                             through recursive calls, can be empty.
   * @param {ISchema} schema A schema.
   * @param {string} delimiter The string to join key paths by.
   */
  public static addValueToTree(tree: any, path: string[], value: RDF.Term, lastKeyPath: string,
                               schema: ISchema, delimiter: string) {
    const key = path[0];
    const keyPath = lastKeyPath ? (lastKeyPath + delimiter + key) : key;
    const singularize: boolean = schema.singularizeVariables[keyPath];
    if (path.length === 1) {
      // Leaf nodes
      if (singularize) {
        if (!tree[key]) {
          tree[key] = value;
        }
      } else {
        if (!tree[key]) {
          tree[key] = [];
        }
        tree[key].push(value);
      }
    } else {
      // Inner nodes
      let nextNode;
      if (singularize) {
        if (!tree[key]) {
          tree[key] = {};
        }
        nextNode = tree[key];
      } else {
        if (!tree[key]) {
          tree[key] = [{}];
        }
        nextNode = tree[key][0];
      }
      Converter.addValueToTree(nextNode, path.slice(1), value, keyPath, schema, delimiter);
    }
  }

  /**
   * Recursively merge the two given trees.
   * @param tree1 A first tree (has key priority on literals).
   * @param tree2 A second tree. All arrays will/should only have a single element.
   * @return {any} The merged tree.
   */
  public static mergeTrees(tree1: any, tree2: any): IMergeResult {
    if (typeof tree1 !== typeof tree2) {
      throw new Error(`Two incompatible tree nodes were found: ${typeof tree1} and ${typeof tree2}`);
    }
    if (Array.isArray(tree1) !== Array.isArray(tree2)) {
      throw new Error(`Two incompatible tree nodes were found: Array?${Array.isArray(tree1)} and Array?${
        Array.isArray(tree2)}`);
    }

    if (typeof tree1 === 'object' && typeof tree2 === 'object') {
      if (tree1.termType && tree2.termType) {
        if (tree1.equals(tree2)) {
          return { valid: true, result: tree1 };
        } else {
          return { valid: false, result: tree1 };
        }
      }

      if (Array.isArray(tree1) && Array.isArray(tree2)) {
        if (tree1.length > 0) {
          const merged = [];
          let valid = false;
          for (const tree1Element of tree1) {
            const mergedElement = Converter.mergeTrees(tree1Element, tree2[0]);
            if (mergedElement.valid) {
              valid = true;
              merged.push(mergedElement.result);
            } else {
              merged.push(tree1Element);
            }
          }

          if (valid) {
            return { valid: true, result: merged };
          }
        }
        return { valid: true, result: tree1.concat(tree2) };
      } else {
        const merged: any = {};

        for (const key2 in tree2) {
          merged[key2] = tree2[key2];
        }
        for (const key1 in tree1) {
          if (merged[key1]) {
            const mergedElement = Converter.mergeTrees(tree1[key1], merged[key1]);
            if (mergedElement.valid) {
              merged[key1] = mergedElement.result;
            } else {
              return { valid: false, result: tree1 };
            }
          } else {
            merged[key1] = tree1[key1];
          }
        }

        return { valid: true, result: merged };
      }
    } else {
      throw new Error(`Unmergable tree types: ${typeof tree1} and ${typeof tree2}`);
    }
  }

  /**
   * Materialize all RDF terms in the given tree to raw values.
   * This does not mutate the original tree.
   * @param tree A tree.
   * @return {any} A materialized tree.
   */
  public static materializeTree(tree: any): any {
    if (tree.termType) {
      return getTermRaw(tree);
    } else if (Array.isArray(tree)) {
      return tree.map(Converter.materializeTree);
    } else {
      const materialized: any = {};
      for (const key in tree) {
        materialized[key] = Converter.materializeTree(tree[key]);
      }
      return materialized;
    }
  }

  /**
   * Convert a complete SPARQL JSON response to a GraphQL results tree.
   * @param sparqlResponse A SPARQL JSON response.
   * @param {ISchema} schema A schema.
   * @return {any} A GraphQL results tree.
   */
  public sparqlJsonResultsToTree(sparqlResponse: any, schema?: ISchema): any {
    return this.bindingsToTree(this.parser.parseJsonResults(sparqlResponse), schema || { singularizeVariables: {} });
  }

  /**
   * Convert an array of bindings to a GraphQL results tree.
   * @param {IBindings[]} bindingsArray An array of bindings.
   * @param {ISchema} schema A schema.
   * @return {any} A GraphQL results tree.
   */
  public bindingsToTree(bindingsArray: IBindings[], schema: ISchema): any {
    const singularRoot = schema && schema.singularizeVariables[''];
    let tree: any = singularRoot ? {} : [];
    for (const bindings of bindingsArray) {
      const subTree: any = singularRoot ? {} : [{}];

      for (const key in bindings) {
        const path: string[] = key.split(this.delimiter);
        const value: RDF.Term = bindings[key];
        Converter.addValueToTree(singularRoot ? subTree : subTree[0], path, value, '', schema, this.delimiter);
      }

      tree = Converter.mergeTrees(tree, subTree).result;
    }

    if (this.materializeRdfJsTerms) {
      tree = Converter.materializeTree(tree);
    }

    return tree;
  }

}

/**
 * Constructor settings object interface for {@link Converter}.
 */
export interface IConverterSettings extends ISettings {
  /**
   * The string to split variable names by.
   * Defaults to '_'.
   */
  delimiter?: string;
  /**
   * If RDFJS terms should be converted to their raw value.
   * Defaults to false.
   */
  materializeRdfJsTerms?: boolean;
}

export interface ISchema {
  /**
   * Defines for each variable if the tree structure should have an array or a singular value for its values.
   * If true, a single value is represented, without array.
   * Defaults to false (arrays), due to the open-world-assumption in RDF.
   */
  singularizeVariables: {[id: string]: boolean};
}

export interface IMergeResult {
  /**
   * If the merging was successful.
   * If not, information was withheld from the result.
   */
  valid: boolean;
  /**
   * The result of the merge.
   */
  result: any;
}
