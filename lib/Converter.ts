import * as RDF from "rdf-js";
import {IBindings, ISettings, SparqlJsonParser} from "sparqljson-parse";

/**
 * Converts SPARQL JSON results originating from a GraphQL query into a GraphQL-like response tree.
 */
export class Converter {

  private readonly parser: SparqlJsonParser;
  private readonly materializeRdfJsTerms: boolean;

  constructor(settings?: IConverterSettings) {
    settings = settings || {};
    settings.prefixVariableQuestionMark = false;
    this.parser = new SparqlJsonParser(settings);
    this.materializeRdfJsTerms = settings.materializeRdfJsTerms;
  }

  /**
   * Adds a value to a tree.
   * @param tree A tree datastructure.
   * @param {string[]} path The path of keys in the tree.
   * @param {Term} value A value to add.
   * @param {string} lastKeyPath The accumulated key path (separated by '_') through recursive calls, can be empty.
   * @param {ISchema} schema A schema.
   * @param {boolean} materializeRdfJsTerms If RDFJS terms should be materialized.
   */
  public static addValueToTree(tree: any, path: string[], value: RDF.Term,
                               lastKeyPath: string, schema: ISchema, materializeRdfJsTerms: boolean) {
    const key = path[0];
    const keyPath = lastKeyPath ? (lastKeyPath + '_' + key) : key;
    const singularize: boolean = schema.singularizeVariables[keyPath];
    if (path.length === 1) {
      // Leaf nodes
      const setValue = materializeRdfJsTerms ? value.value : value;
      if (singularize) {
        if (!tree[key]) {
          tree[key] = setValue;
        }
      } else {
        if (!tree[key]) {
          tree[key] = [];
        }
        tree[key].push(setValue);
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
          tree[key] = [];
        }
        nextNode = {};
        tree[key].push(nextNode);
      }
      Converter.addValueToTree(nextNode, path.slice(1), value, keyPath, schema, materializeRdfJsTerms);
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
    const tree: any = {};
    for (const bindings of bindingsArray) {
      for (const key in bindings) {
        const path: string[] = key.split('_');
        const value: RDF.Term = bindings[key];
        Converter.addValueToTree(tree, path, value, '', schema, this.materializeRdfJsTerms);
      }
    }
    return { data: tree };
  }

}

/**
 * Constructor settings object interface for {@link Converter}.
 */
export interface IConverterSettings extends ISettings {
  /**
   * If RDFJS terms should be converted to their raw value.
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
