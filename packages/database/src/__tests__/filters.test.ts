import { describe, it, expect } from 'vitest';
import {
  filters,
  sorts,
  parseFiltersFromParams,
  parseSortsFromParams,
  createTextSearchFilter,
} from '../filters';

describe('filters helper', () => {
  describe('eq', () => {
    it('creates equality filter', () => {
      const filter = filters.eq('name', 'John');

      expect(filter.column).toBe('name');
      expect(filter.operator).toBe('eq');
      expect(filter.value).toBe('John');
    });
  });

  describe('neq', () => {
    it('creates not-equal filter', () => {
      const filter = filters.neq('status', 'deleted');

      expect(filter.operator).toBe('neq');
    });
  });

  describe('gt/gte/lt/lte', () => {
    it('creates comparison filters', () => {
      expect(filters.gt('age', 18).operator).toBe('gt');
      expect(filters.gte('age', 18).operator).toBe('gte');
      expect(filters.lt('age', 65).operator).toBe('lt');
      expect(filters.lte('age', 65).operator).toBe('lte');
    });
  });

  describe('like/ilike', () => {
    it('creates pattern filters', () => {
      expect(filters.like('name', '%john%').operator).toBe('like');
      expect(filters.ilike('name', '%JOHN%').operator).toBe('ilike');
    });
  });

  describe('is', () => {
    it('creates is null/boolean filter', () => {
      const filter = filters.is('deleted_at', null);

      expect(filter.operator).toBe('is');
      expect(filter.value).toBeNull();
    });
  });

  describe('in', () => {
    it('creates in-array filter', () => {
      const filter = filters.in('status', ['active', 'pending']);

      expect(filter.operator).toBe('in');
      expect(filter.value).toEqual(['active', 'pending']);
    });
  });

  describe('contains', () => {
    it('creates contains filter for JSONB', () => {
      const filter = filters.contains('tags', ['important']);

      expect(filter.operator).toBe('contains');
    });
  });

  describe('textSearch', () => {
    it('creates full text search filter', () => {
      const filter = filters.textSearch('description', 'search query');

      expect(filter.operator).toBe('textSearch');
    });
  });

  describe('date filters', () => {
    it('creates createdAfter filter', () => {
      const date = new Date('2024-01-01');
      const filter = filters.createdAfter(date);

      expect(filter.column).toBe('created_at');
      expect(filter.operator).toBe('gte');
      expect(filter.value).toBe(date.toISOString());
    });

    it('creates createdBefore filter', () => {
      const filter = filters.createdBefore('2024-12-31');

      expect(filter.column).toBe('created_at');
      expect(filter.operator).toBe('lte');
      expect(filter.value).toBe('2024-12-31');
    });

    it('creates updatedAfter filter', () => {
      const filter = filters.updatedAfter('2024-06-01');

      expect(filter.column).toBe('updated_at');
      expect(filter.operator).toBe('gte');
    });

    it('creates updatedBefore filter', () => {
      const filter = filters.updatedBefore('2024-06-30');

      expect(filter.column).toBe('updated_at');
      expect(filter.operator).toBe('lte');
    });
  });

  describe('byUser', () => {
    it('creates user filter', () => {
      const filter = filters.byUser('user-123');

      expect(filter.column).toBe('user_id');
      expect(filter.operator).toBe('eq');
      expect(filter.value).toBe('user-123');
    });
  });
});

describe('sorts helper', () => {
  describe('newestFirst', () => {
    it('creates descending created_at sort', () => {
      const sort = sorts.newestFirst();

      expect(sort.column).toBe('created_at');
      expect(sort.ascending).toBe(false);
    });
  });

  describe('oldestFirst', () => {
    it('creates ascending created_at sort', () => {
      const sort = sorts.oldestFirst();

      expect(sort.column).toBe('created_at');
      expect(sort.ascending).toBe(true);
    });
  });

  describe('recentlyUpdated', () => {
    it('creates descending updated_at sort', () => {
      const sort = sorts.recentlyUpdated();

      expect(sort.column).toBe('updated_at');
      expect(sort.ascending).toBe(false);
    });
  });

  describe('byName', () => {
    it('creates ascending name sort by default', () => {
      const sort = sorts.byName();

      expect(sort.column).toBe('name');
      expect(sort.ascending).toBe(true);
    });

    it('creates descending name sort when specified', () => {
      const sort = sorts.byName(false);

      expect(sort.ascending).toBe(false);
    });
  });

  describe('by', () => {
    it('creates custom sort', () => {
      const sort = sorts.by('custom_field', false);

      expect(sort.column).toBe('custom_field');
      expect(sort.ascending).toBe(false);
    });
  });
});

describe('parseFiltersFromParams', () => {
  it('parses filter params from URL', () => {
    const params = new URLSearchParams('filter[name]=eq:John&filter[age]=gt:18');
    const result = parseFiltersFromParams(params);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ column: 'name', operator: 'eq', value: 'John' });
    expect(result[1]).toEqual({ column: 'age', operator: 'gt', value: 18 });
  });

  it('handles null values', () => {
    const params = new URLSearchParams('filter[deleted_at]=is:null');
    const result = parseFiltersFromParams(params);

    expect(result[0].value).toBeNull();
  });

  it('handles boolean values', () => {
    const params = new URLSearchParams('filter[active]=eq:true');
    const result = parseFiltersFromParams(params);

    expect(result[0].value).toBe(true);
  });

  it('handles array values', () => {
    const params = new URLSearchParams('filter[status]=in:[active,pending]');
    const result = parseFiltersFromParams(params);

    expect(result[0].value).toEqual(['active', 'pending']);
  });

  it('ignores invalid operators', () => {
    const params = new URLSearchParams('filter[name]=invalid:value');
    const result = parseFiltersFromParams(params);

    expect(result).toHaveLength(0);
  });
});

describe('parseSortsFromParams', () => {
  it('parses single sort param', () => {
    const params = new URLSearchParams('sort=name:asc');
    const result = parseSortsFromParams(params);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ column: 'name', ascending: true });
  });

  it('parses multiple sort params', () => {
    const params = new URLSearchParams('sort=name:asc,created_at:desc');
    const result = parseSortsFromParams(params);

    expect(result).toHaveLength(2);
    expect(result[0].ascending).toBe(true);
    expect(result[1].ascending).toBe(false);
  });

  it('returns empty array when no sort param', () => {
    const params = new URLSearchParams('');
    const result = parseSortsFromParams(params);

    expect(result).toEqual([]);
  });
});

describe('createTextSearchFilter', () => {
  it('creates OR filter for multiple columns', () => {
    const filter = createTextSearchFilter('test', ['name', 'description']);

    expect(filter).toContain('name.ilike.%test%');
    expect(filter).toContain('description.ilike.%test%');
  });

  it('escapes special characters', () => {
    const filter = createTextSearchFilter('test%value', ['name']);

    expect(filter).toContain('%test\\%value%');
  });

  it('returns empty string for empty query', () => {
    const filter = createTextSearchFilter('', ['name']);

    expect(filter).toBe('');
  });

  it('returns empty string for empty columns', () => {
    const filter = createTextSearchFilter('test', []);

    expect(filter).toBe('');
  });
});
