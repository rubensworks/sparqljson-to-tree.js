import {literal} from "@rdfjs/data-model";
import {Converter} from "../lib/Converter";

describe('Converter', () => {

  describe('constructed without options', () => {
    const optionlessInstance = new Converter();

    it('should be a valid instance', () => {
      return expect(optionlessInstance).toBeInstanceOf(Converter);
    });

    it('should not materialize terms', () => {
      return expect((<any> optionlessInstance).materializeRdfJsTerms).toBeFalsy();
    });

    it('should have the _ delimiter', () => {
      return expect((<any> optionlessInstance).delimiter).toEqual('_');
    });
  });

  describe('constructed with empty options', () => {
    const optionsEmptyInstance = new Converter({});

    it('should be a valid instance', () => {
      return expect(optionsEmptyInstance).toBeInstanceOf(Converter);
    });

    it('should not materialize terms', () => {
      return expect((<any> optionsEmptyInstance).materializeRdfJsTerms).toBeFalsy();
    });

    it('should have the _ delimiter', () => {
      return expect((<any> optionsEmptyInstance).delimiter).toEqual('_');
    });
  });

  describe('constructed with options', () => {
    const optionsInstance = new Converter({ materializeRdfJsTerms: true, delimiter: '$' });

    it('should be a valid instance', () => {
      return expect(optionsInstance).toBeInstanceOf(Converter);
    });

    it('should materialize terms', () => {
      return expect((<any> optionsInstance).materializeRdfJsTerms).toBeTruthy();
    });

    it('should have the $ delimiter', () => {
      return expect((<any> optionsInstance).delimiter).toEqual('$');
    });
  });

  let converter;

  beforeEach(() => {
    converter = new Converter();
  });

  describe('#sparqlJsonResultsToTree', () => {
    it('should convert an empty SPARQL JSON response', () => {
      return expect(converter.sparqlJsonResultsToTree({ results: { bindings: [] } }))
        .toEqual([]);
    });

    it('should convert an empty SPARQL JSON response for a singular root', () => {
      return expect(converter.sparqlJsonResultsToTree({ results: { bindings: [] } },
        { singularizeVariables: { '': true } })).toEqual({});
    });

    it('should convert a non-empty SPARQL JSON response', () => {
      return expect(converter.sparqlJsonResultsToTree({ results: { bindings: [
        { books_name: { type: 'literal', value: 'Book 1' } },
        { books_name: { type: 'literal', value: 'Book 2' } },
        { books_name: { type: 'literal', value: 'Book 3' } },
        { books_name: { type: 'literal', value: 'Book 4' } },
        { books_name: { type: 'literal', value: 'Book 5' } },
      ] } }, { singularizeVariables: { '': true, 'books': false, 'books_name': true } }))
        .toEqual({ books: [
          { name: literal('Book 1') },
          { name: literal('Book 2') },
          { name: literal('Book 3') },
          { name: literal('Book 4') },
          { name: literal('Book 5') },
        ] });
    });
  });

  describe('#bindingsToTree', () => {
    it('should convert an empty bindings array', () => {
      return expect(converter.bindingsToTree([])).toEqual([]);
    });

    it('should convert an empty bindings array for a singular root', () => {
      return expect(converter.bindingsToTree([], { singularizeVariables: { '': true }})).toEqual({});
    });

    it('should convert a non-empty bindings array', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2') },
        { books_name: literal('Book 3') },
        { books_name: literal('Book 4') },
        { books_name: literal('Book 5') },
      ], { singularizeVariables: { '': true, 'books': false, 'books_name': true } }))
        .toEqual({ books: [
          { name: literal('Book 1') },
          { name: literal('Book 2') },
          { name: literal('Book 3') },
          { name: literal('Book 4') },
          { name: literal('Book 5') },
        ] });
    });

    it('should convert a non-empty bindings array and materialize terms', () => {
      return expect(new Converter({ materializeRdfJsTerms: true }).bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2') },
        { books_name: literal('Book 3') },
        { books_name: literal('Book 4') },
        { books_name: literal('Book 5') },
      ], { singularizeVariables: { '': true, 'books': false, 'books_name': true } }))
        .toEqual({ books: [
            { name: 'Book 1' },
            { name: 'Book 2' },
            { name: 'Book 3' },
            { name: 'Book 4' },
            { name: 'Book 5' },
        ] });
    });

    it('should convert a non-empty bindings array for a singular root', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2') },
        { books_name: literal('Book 3') },
        { books_name: literal('Book 4') },
        { books_name: literal('Book 5') },
      ], { singularizeVariables: { books: false, books_name: true } }))
        .toEqual([
          { books: [
              { name: literal('Book 1') },
              { name: literal('Book 2') },
              { name: literal('Book 3') },
              { name: literal('Book 4') },
              { name: literal('Book 5') },
          ] },
        ]);
    });

    it('should convert a non-empty bindings array with multiple binding links for a singular root', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1'), books_author: literal('Person 1') },
        { books_name: literal('Book 2'), books_author: literal('Person 2') },
        { books_name: literal('Book 3'), books_author: literal('Person 3') },
        { books_name: literal('Book 4'), books_author: literal('Person 4') },
        { books_name: literal('Book 5'), books_author: literal('Person 5') },
      ], { singularizeVariables: { books: true, books_name: true, books_author: true } }))
        .toEqual([
          { books: { name: literal('Book 1'), author: literal('Person 1') } },
          { books: { name: literal('Book 2'), author: literal('Person 2') } },
          { books: { name: literal('Book 3'), author: literal('Person 3') } },
          { books: { name: literal('Book 4'), author: literal('Person 4') } },
          { books: { name: literal('Book 5'), author: literal('Person 5') } },
        ]);
    });

    it('should convert bindings in arrays with partially overlapping elements', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1'), books_authors_name: literal('Person 1.1'), books_authors_id: literal('1.1') },
        { books_name: literal('Book 1'), books_authors_name: literal('Person 1.2'), books_authors_id: literal('1.2') },
        { books_name: literal('Book 2'), books_authors_name: literal('Person 2.1'), books_authors_id: literal('2.1') },
        { books_name: literal('Book 2'), books_authors_name: literal('Person 2.2'), books_authors_id: literal('2.2') },
      ], { singularizeVariables: { books: true, books_name: true, books_authors_name: true, books_authors_id: true } }))
        .toEqual([
          {
            books: {
              authors: [
                { name: literal('Person 1.1'), id: literal('1.1') },
                { name: literal('Person 1.2'), id: literal('1.2') },
              ],
              name: literal('Book 1'),
            },
          },
          {
            books: {
              authors: [
                { name: literal('Person 2.1'), id: literal('2.1') },
                { name: literal('Person 2.2'), id: literal('2.2') },
              ],
              name: literal('Book 2'),
            },
          },
        ]);
    });

    it('should convert with no singularizations', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2') },
        { books_name: literal('Book 3') },
        { books_name: literal('Book 4') },
        { books_name: literal('Book 5') },
      ], { singularizeVariables: {} }))
        .toEqual([
          { books: [
            {
              name: [
                literal('Book 1'),
                literal('Book 2'),
                literal('Book 3'),
                literal('Book 4'),
                literal('Book 5'),
              ],
            },
          ] },
        ]);
    });

    it('should convert with no singularizations and optional values', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2'), books_author: literal('Alice') },
        { books_name: literal('Book 3') },
        { books_name: literal('Book 4'), books_author: literal('Bob') },
        { books_name: literal('Book 5') },
      ], { singularizeVariables: {} }))
        .toEqual([
          { books: [
            {
              author: [
                literal('Alice'),
                literal('Bob'),
              ],
              name: [
                literal('Book 1'),
                literal('Book 2'),
                literal('Book 3'),
                literal('Book 4'),
                literal('Book 5'),
              ],
            },
          ] },
        ]);
    });

    it('should convert with singular books and optional values', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2'), books_author: literal('Alice') },
        { books_name: literal('Book 3') },
        { books_name: literal('Book 4'), books_author: literal('Bob') },
        { books_name: literal('Book 5') },
      ], { singularizeVariables: { books: true } }))
        .toEqual([
          {
            books: {
              author: [
                literal('Alice'),
                literal('Bob'),
              ],
              name: [
                literal('Book 1'),
                literal('Book 2'),
                literal('Book 3'),
                literal('Book 4'),
                literal('Book 5'),
              ],
            },
          },
        ]);
    });

    it('should convert with singular name and optional values', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2'), books_author: literal('Alice') },
        { books_name: literal('Book 3') },
        { books_name: literal('Book 4'), books_author: literal('Bob') },
        { books_name: literal('Book 5') },
      ], { singularizeVariables: { books_name: true } }))
        .toEqual([
          {
            books: [
              {
                name: literal('Book 1'),
              },
              {
                author: [ literal('Alice') ],
                name: literal('Book 2'),
              },
              {
                name: literal('Book 3'),
              },
              {
                author: [ literal('Bob') ],
                name: literal('Book 4'),
              },
              {
                name: literal('Book 5'),
              },
            ],
          },
        ]);
    });

    it('should convert with singular name and author and optional values', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2'), books_author: literal('Alice') },
        { books_name: literal('Book 3') },
        { books_name: literal('Book 4'), books_author: literal('Bob') },
        { books_name: literal('Book 5') },
      ], { singularizeVariables: { books_name: true, books_author: true } }))
        .toEqual([
          {
            books: [
              {
                name: literal('Book 1'),
              },
              {
                author: literal('Alice'),
                name: literal('Book 2'),
              },
              {
                name: literal('Book 3'),
              },
              {
                author: literal('Bob'),
                name: literal('Book 4'),
              },
              {
                name: literal('Book 5'),
              },
            ],
          },
        ]);
    });

    it('should convert with singular books, name and author and optional values', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2'), books_author: literal('Alice') },
        { books_name: literal('Book 3') },
        { books_name: literal('Book 4'), books_author: literal('Bob') },
        { books_name: literal('Book 5') },
      ], { singularizeVariables: { books: true, books_name: true, books_author: true } }))
        .toEqual([
          {
            books: {
              name: literal('Book 1'),
            },
          },
          {
            books: {
              author: literal('Alice'),
              name: literal('Book 2'),
            },
          },
          {
            books: {
              name: literal('Book 3'),
            },
          },
          {
            books: {
              author: literal('Bob'),
              name: literal('Book 4'),
            },
          },
          {
            books: {
              name: literal('Book 5'),
            },
          },
        ]);
    });

    it('should convert with singular root, books, name and author and optional values', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2'), books_author: literal('Alice') },
        { books_name: literal('Book 3') },
        { books_name: literal('Book 4'), books_author: literal('Bob') },
        { books_name: literal('Book 5') },
      ], { singularizeVariables: { '': true, 'books': true, 'books_name': true, 'books_author': true } }))
        .toEqual({
          books: {
            name: literal('Book 1'),
          },
        });
    });

    it('should convert with singular root, name and author and optional values', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2'), books_author: literal('Alice') },
        { books_name: literal('Book 3') },
        { books_name: literal('Book 4'), books_author: literal('Bob') },
        { books_name: literal('Book 5') },
      ], { singularizeVariables: { '': true, 'books_name': true, 'books_author': true } }))
        .toEqual({
          books: [
            {
              name: literal('Book 1'),
            },
            {
              author: literal('Alice'),
              name: literal('Book 2'),
            },
            {
              name: literal('Book 3'),
            },
            {
              author: literal('Bob'),
              name: literal('Book 4'),
            },
            {
              name: literal('Book 5'),
            },
          ],
        });
    });

    it('should fail to convert results with invalid terms', () => {
      return expect(() => converter.bindingsToTree([
        { books_name: 'a' },
        { books_name: 'b' },
      ], { singularizeVariables: { '': true, 'books': false, 'books_name': true } }))
        .toThrow(new Error('Unmergable tree types: string and string'));
    });

    it('should convert singular results with incompatible values', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2') },
      ], { singularizeVariables: { '': true, 'books': true, 'books_name': true } }))
        .toEqual({
          books: {
            name: literal('Book 1'),
          },
        });
    });
  });

  describe('#addValueToTree', () => {
    it('should add leaf values without singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: false,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, '_');
      return expect(tree).toEqual({ leaf: [ literal('abc') ] });
    });

    it('should add multiple leaf values without singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: false,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, '_');
      Converter.addValueToTree(tree, [ 'leaf' ], literal('def'), '',
        { singularizeVariables }, '_');
      Converter.addValueToTree(tree, [ 'leaf' ], literal('ghi'), '',
        { singularizeVariables }, '_');
      return expect(tree).toEqual({ leaf: [ literal('abc'), literal('def'), literal('ghi') ] });
    });

    it('should add multiple leaf values without singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: false,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, '_');
      Converter.addValueToTree(tree, [ 'leaf' ], literal('def'), '',
        { singularizeVariables }, '_');
      Converter.addValueToTree(tree, [ 'leaf' ], literal('ghi'), '',
        { singularizeVariables }, '_');
      return expect(tree).toEqual({ leaf: [ literal('abc'), literal('def'), literal('ghi') ] });
    });

    it('should add leaf values with singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: true,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, '_');
      return expect(tree).toEqual({ leaf: literal('abc') });
    });

    it('should add the first of multiple leaf values with singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: true,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, '_');
      Converter.addValueToTree(tree, [ 'leaf' ], literal('def'), '',
        { singularizeVariables }, '_');
      Converter.addValueToTree(tree, [ 'leaf' ], literal('ghi'), '',
        { singularizeVariables }, '_');
      return expect(tree).toEqual({ leaf: literal('abc') });
    });

    it('should add inner values without singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        inner: false,
        inner_leaf: false,
      };
      Converter.addValueToTree(tree, [ 'inner', 'leaf' ], literal('abc'), '',
        { singularizeVariables }, '_');
      return expect(tree).toEqual({ inner: [ { leaf: [ literal('abc') ] } ] });
    });

    it('should add inner values with singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        inner: true,
        inner_leaf: false,
      };
      Converter.addValueToTree(tree, [ 'inner', 'leaf' ], literal('abc'), '',
        { singularizeVariables }, '_');
      return expect(tree).toEqual({ inner: { leaf: [ literal('abc') ] } });
    });

    it('should add multiple inner values without singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        inner: false,
        inner_leaf: false,
      };
      Converter.addValueToTree(tree, [ 'inner', 'leaf' ], literal('abc'), '',
        { singularizeVariables }, '_');
      Converter.addValueToTree(tree, [ 'inner', 'leaf' ], literal('def'), '',
        { singularizeVariables }, '_');
      return expect(tree).toEqual({ inner: [ { leaf: [ literal('abc'), literal('def') ] } ] });
    });

    it('should add the multiple inner values with singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        inner: true,
        inner_leaf: false,
      };
      Converter.addValueToTree(tree, [ 'inner', 'leaf' ], literal('abc'), '',
        { singularizeVariables }, '_');
      Converter.addValueToTree(tree, [ 'inner', 'leaf' ], literal('def'), '',
        { singularizeVariables }, '_');
      return expect(tree).toEqual({ inner: { leaf: [ literal('abc'), literal('def') ] } });
    });
  });

  describe('#mergeTrees', () => {
    it('should error on merging different tree types', () => {
      return expect(() => Converter.mergeTrees({}, 'a'))
        .toThrow(new Error('Two incompatible tree nodes were found: object and string'));
    });

    it('should error on merging different tree types with arrays', () => {
      return expect(() => Converter.mergeTrees([{}], {}))
        .toThrow(new Error('Two incompatible tree nodes were found: Array?true and Array?false'));
    });

    it('should error on merging primitives', () => {
      return expect(() => Converter.mergeTrees('a', 'b'))
        .toThrow(new Error('Unmergable tree types: string and string'));
    });

    it('should fail to merge non-equal terms', () => {
      return expect(Converter.mergeTrees(literal('abc'), literal('def')))
        .toEqual({ valid: false, result: literal('abc') });
    });

    it('should merge equal terms', () => {
      return expect(Converter.mergeTrees(literal('abc'), literal('abc')))
        .toEqual({ valid: true, result: literal('abc') });
    });

    it('should merge equal objects', () => {
      return expect(Converter.mergeTrees(
        { a: literal('abc') },
        { a: literal('abc') },
      )).toEqual({
        result: { a: literal('abc') },
        valid: true,
      });
    });

    it('should merge non-equal objects', () => {
      return expect(Converter.mergeTrees(
        { a: literal('abc') },
        { b: literal('abc') },
      )).toEqual({
        result: { a: literal('abc'), b: literal('abc') },
        valid: true,
      });
    });

    it('should merge non-equal objects with many keys', () => {
      return expect(Converter.mergeTrees(
        { a: literal('a'), b: literal('b') },
        { c: literal('c'), d: literal('d') },
      )).toEqual({
        result: {
          a: literal('a'),
          b: literal('b'),
          c: literal('c'),
          d: literal('d'),
        },
        valid: true,
      });
    });

    it('should merge non-equal objects with many keys that overlap and are equal', () => {
      return expect(Converter.mergeTrees(
        { a: literal('a'), b: literal('b'), c: literal('c') },
        { c: literal('c'), d: literal('d') },
      )).toEqual({
        result: {
          a: literal('a'),
          b: literal('b'),
          c: literal('c'),
          d: literal('d'),
        },
        valid: true,
      });
    });

    it('should merge non-equal objects with many keys that overlap and are not equal', () => {
      return expect(Converter.mergeTrees(
        { a: literal('a'), b: literal('b'), c: literal('c_other') },
        { c: literal('c'), d: literal('d') },
      )).toEqual({
        result: { a: literal('a'), b: literal('b'), c: literal('c_other') },
        valid: false,
      });
    });

    it('should merge equal arrays', () => {
      return expect(Converter.mergeTrees(
        [ literal('abc') ],
        [ literal('abc') ],
      )).toEqual({
        result: [ literal('abc') ],
        valid: true,
      });
    });

    it('should merge non-equal arrays', () => {
      return expect(Converter.mergeTrees(
        [ literal('abc') ],
        [ literal('def') ],
      )).toEqual({
        result: [ literal('abc'), literal('def') ],
        valid: true,
      });
    });

    it('should merge equal arrays with objects', () => {
      return expect(Converter.mergeTrees(
        [ { a: literal('abc') } ],
        [ { a: literal('abc') } ],
      )).toEqual({
        result: [ { a: literal('abc') } ],
        valid: true,
      });
    });

    it('should merge arrays with non-equal distinct objects at object level', () => {
      return expect(Converter.mergeTrees(
        [ { a: literal('abc') } ],
        [ { b: literal('def') } ],
      )).toEqual({
        result: [ { a: literal('abc'), b: literal('def') } ],
        valid: true,
      });
    });

    it('should merge arrays with non-equal overlapping objects at array level', () => {
      return expect(Converter.mergeTrees(
        [ { a: literal('abc') } ],
        [ { a: literal('def') } ],
      )).toEqual({
        result: [ { a: literal('abc') }, { a: literal('def') } ],
        valid: true,
      });
    });
  });

  describe('#materializeTree', () => {
    it('should materialize terms', () => {
      return expect(Converter.materializeTree(literal('abc'))).toEqual('abc');
    });

    it('should materialize arrays', () => {
      return expect(Converter.materializeTree(
        [ literal('abc'), literal('def') ],
      )).toEqual([ 'abc', 'def' ]);
    });

    it('should materialize objects', () => {
      return expect(Converter.materializeTree(
        {
          a: literal('a'),
          b: literal('b'),
        },
      )).toEqual({
        a: 'a',
        b: 'b',
      });
    });
  });
});
