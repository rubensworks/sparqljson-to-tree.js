import {literal} from "rdf-data-model";
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
        .toEqual({});
    });

    it('should convert a non-empty SPARQL JSON response', () => {
      return expect(converter.sparqlJsonResultsToTree({ results: { bindings: [
        { books_name: { type: 'literal', value: 'Book 1' } },
        { books_name: { type: 'literal', value: 'Book 2' } },
        { books_name: { type: 'literal', value: 'Book 3' } },
        { books_name: { type: 'literal', value: 'Book 4' } },
        { books_name: { type: 'literal', value: 'Book 5' } },
      ] } }, { singularizeVariables: { books: false, books_name: true } }))
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
      return expect(converter.bindingsToTree([])).toEqual({});
    });

    it('should convert a non-empty bindings array', () => {
      return expect(converter.bindingsToTree([
        { books_name: literal('Book 1') },
        { books_name: literal('Book 2') },
        { books_name: literal('Book 3') },
        { books_name: literal('Book 4') },
        { books_name: literal('Book 5') },
      ], { singularizeVariables: { books: false, books_name: true } }))
        .toEqual({ books: [
          { name: literal('Book 1') },
          { name: literal('Book 2') },
          { name: literal('Book 3') },
          { name: literal('Book 4') },
          { name: literal('Book 5') },
        ] });
    });
  });

  describe('#addValueToTree', () => {
    it('should add leaf values without materializing and without singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: false,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, false);
      return expect(tree).toEqual({ leaf: [ literal('abc') ] });
    });

    it('should add leaf values with materializing and without singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: false,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, true);
      return expect(tree).toEqual({ leaf: [ 'abc' ] });
    });

    it('should add multiple leaf values without materializing and without singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: false,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, false);
      Converter.addValueToTree(tree, [ 'leaf' ], literal('def'), '',
        { singularizeVariables }, false);
      Converter.addValueToTree(tree, [ 'leaf' ], literal('ghi'), '',
        { singularizeVariables }, false);
      return expect(tree).toEqual({ leaf: [ literal('abc'), literal('def'), literal('ghi') ] });
    });

    it('should add multiple leaf values with materializing and without singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: false,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, true);
      Converter.addValueToTree(tree, [ 'leaf' ], literal('def'), '',
        { singularizeVariables }, true);
      Converter.addValueToTree(tree, [ 'leaf' ], literal('ghi'), '',
        { singularizeVariables }, true);
      return expect(tree).toEqual({ leaf: [ 'abc', 'def', 'ghi' ] });
    });

    it('should add leaf values without materializing and with singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: true,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, false);
      return expect(tree).toEqual({ leaf: literal('abc') });
    });

    it('should add leaf values with materializing and with singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: true,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, true);
      return expect(tree).toEqual({ leaf: 'abc' });
    });

    it('should add the first of multiple leaf values without materializing and with singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: true,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, false);
      Converter.addValueToTree(tree, [ 'leaf' ], literal('def'), '',
        { singularizeVariables }, false);
      Converter.addValueToTree(tree, [ 'leaf' ], literal('ghi'), '',
        { singularizeVariables }, false);
      return expect(tree).toEqual({ leaf: literal('abc') });
    });

    it('should add the first of multiple leaf values with materializing and with singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        leaf: true,
      };
      Converter.addValueToTree(tree, [ 'leaf' ], literal('abc'), '',
        { singularizeVariables }, true);
      Converter.addValueToTree(tree, [ 'leaf' ], literal('def'), '',
        { singularizeVariables }, true);
      Converter.addValueToTree(tree, [ 'leaf' ], literal('ghi'), '',
        { singularizeVariables }, true);
      return expect(tree).toEqual({ leaf: 'abc' });
    });

    it('should add inner values without singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        inner: false,
        inner_leaf: false,
      };
      Converter.addValueToTree(tree, [ 'inner', 'leaf' ], literal('abc'), '',
        { singularizeVariables }, false);
      return expect(tree).toEqual({ inner: [ { leaf: [ literal('abc') ] } ] });
    });

    it('should add inner values with singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        inner: true,
        inner_leaf: false,
      };
      Converter.addValueToTree(tree, [ 'inner', 'leaf' ], literal('abc'), '',
        { singularizeVariables }, false);
      return expect(tree).toEqual({ inner: { leaf: [ literal('abc') ] } });
    });

    it('should add multiple inner values without singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        inner: false,
        inner_leaf: false,
      };
      Converter.addValueToTree(tree, [ 'inner', 'leaf' ], literal('abc'), '',
        { singularizeVariables }, false);
      Converter.addValueToTree(tree, [ 'inner', 'leaf' ], literal('def'), '',
        { singularizeVariables }, false);
      return expect(tree).toEqual({ inner: [ { leaf: [ literal('abc') ] }, { leaf: [ literal('def') ] } ] });
    });

    it('should add the multiple inner values with singularizing', () => {
      const tree = {};
      const singularizeVariables = {
        inner: true,
        inner_leaf: false,
      };
      Converter.addValueToTree(tree, [ 'inner', 'leaf' ], literal('abc'), '',
        { singularizeVariables }, false);
      Converter.addValueToTree(tree, [ 'inner', 'leaf' ], literal('def'), '',
        { singularizeVariables }, false);
      return expect(tree).toEqual({ inner: { leaf: [ literal('abc'), literal('def') ] } });
    });
  });
});
