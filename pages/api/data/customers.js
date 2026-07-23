import { resolveConditional } from '../../../components/lib/utils/ConditionalUtils';
import path from 'node:path';
import url from 'node:url';
import { promises as fs } from 'fs-extra';

function getSlice(queryObject, customers) {
    if (queryObject.first != null && queryObject.rows != null) {
        let first = Number.parseInt(queryObject.first);
        let rows = Number.parseInt(queryObject.rows);

        return customers.slice(first, first + rows);
    }

    return customers;
}

function sort(queryObject, customers) {
    customers.sort((data1, data2) => {
        let value1 = resolveFieldData(data1, queryObject.sortField);
        let value2 = resolveFieldData(data2, queryObject.sortField);
        let result = null;

        if (value1 == null && value2 != null) {
            result = -1;
        } else if (value1 != null && value2 == null) {
            result = 1;
        } else if (value1 == null && value2 == null) {
            result = 0;
        } else if (typeof value1 === 'string' && typeof value2 === 'string') {
            result = value1.localeCompare(value2);
        } else {
            result =
                value1 < value2
                    ? -1
                    : resolveConditional(
                          value1 > value2,
                          () => 1,
                          () => 0
                      );
        }

        return queryObject.sortOrder * result;
    });

    return customers;
}

const filters = {
    startsWith: (value, filter) => {
        if (filter === undefined || filter === null || filter.trim() === '') {
            return true;
        }

        if (value === undefined || value === null) {
            return false;
        }

        let filterValue = removeAccents(filter.toString()).toLocaleLowerCase();
        let stringValue = removeAccents(value.toString()).toLocaleLowerCase();

        return stringValue.slice(0, filterValue.length) === filterValue;
    },
    contains: (value, filter) => {
        if (filter === undefined || filter === null || (typeof filter === 'string' && filter.trim() === '')) {
            return true;
        }

        if (value === undefined || value === null) {
            return false;
        }

        let filterValue = removeAccents(filter.toString()).toLocaleLowerCase();
        let stringValue = removeAccents(value.toString()).toLocaleLowerCase();

        return stringValue.includes(filterValue);
    },
    notContains: (value, filter) => {
        if (filter === undefined || filter === null || (typeof filter === 'string' && filter.trim() === '')) {
            return true;
        }

        if (value === undefined || value === null) {
            return false;
        }

        let filterValue = removeAccents(filter.toString()).toLocaleLowerCase();
        let stringValue = removeAccents(value.toString()).toLocaleLowerCase();

        return !stringValue.includes(filterValue);
    },
    endsWith: (value, filter) => {
        if (filter === undefined || filter === null || filter.trim() === '') {
            return true;
        }

        if (value === undefined || value === null) {
            return false;
        }

        let filterValue = removeAccents(filter.toString()).toLocaleLowerCase();
        let stringValue = removeAccents(value.toString()).toLocaleLowerCase();

        return stringValue.includes(filterValue, stringValue.length - filterValue.length);
    },
    equals: (value, filter) => {
        if (filter === undefined || filter === null || (typeof filter === 'string' && filter.trim() === '')) {
            return true;
        }

        if (value === undefined || value === null) {
            return false;
        }

        if (value.getTime && filter.getTime) {
            return value.getTime() === filter.getTime();
        }

        return removeAccents(value.toString()).toLocaleLowerCase() == removeAccents(filter.toString()).toLocaleLowerCase();
    },
    notEquals: (value, filter) => {
        if (filter === undefined || filter === null || (typeof filter === 'string' && filter.trim() === '')) {
            return false;
        }

        if (value === undefined || value === null) {
            return true;
        }

        if (value.getTime && filter.getTime) {
            return value.getTime() !== filter.getTime();
        }

        return removeAccents(value.toString()).toLocaleLowerCase() != removeAccents(filter.toString()).toLocaleLowerCase();
    },
    in: (value, filter) => {
        if (filter === undefined || filter === null || filter.length === 0) {
            return true;
        }

        for (const _item of filter) {
            if (equals(value, _item)) {
                return true;
            }
        }

        return false;
    }
};

function filter(value, field, filterValue, filterMatchMode) {
    let filteredItems = [];

    if (value) {
        for (let item of value) {
            let fieldValue = resolveFieldData(item, field);

            if (filters[filterMatchMode](fieldValue, filterValue)) {
                filteredItems.push(item);
            }
        }
    }

    return filteredItems;
}

function equals(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }

    const evaluateComplexCondition1 = () => obj1 && obj2 && typeof obj1 === 'object' && typeof obj2 === 'object';

    if (evaluateComplexCondition1()) {
        let i;
        let length;
        let key;
        let keys = Object.keys(obj1);

        length = keys.length;

        if (length !== Object.keys(obj2).length) {
            return false;
        }

        for (i = length; i-- !== 0; ) {
            if (!Object.hasOwn(obj2, keys[i])) {
                return false;
            }
        }

        for (i = length; i-- !== 0; ) {
            key = keys[i];

            if (!equals(obj1[key], obj2[key])) {
                return false;
            }
        }

        return true;
    }

    return Number.isNaN(obj1) && Number.isNaN(obj2);
}

function removeAccents(str) {
    if (str && str.search(/[\xC0-\xFF]/g) > -1) {
        str = str
            .replaceAll(/[\xC0-\xC5]/g, 'A')
            .replaceAll('\xC6', 'AE')
            .replaceAll('\xC7', 'C')
            .replaceAll(/[\xC8-\xCB]/g, 'E')
            .replaceAll(/[\xCC-\xCF]/g, 'I')
            .replaceAll('\xD0', 'D')
            .replaceAll('\xD1', 'N')
            .replaceAll(/[\xD2-\xD6\xD8]/g, 'O')
            .replaceAll(/[\xD9-\xDC]/g, 'U')
            .replaceAll('\xDD', 'Y')
            .replaceAll('\xDE', 'P')
            .replaceAll(/[\xE0-\xE5]/g, 'a')
            .replaceAll('\xE6', 'ae')
            .replaceAll('\xE7', 'c')
            .replaceAll(/[\xE8-\xEB]/g, 'e')
            .replaceAll(/[\xEC-\xEF]/g, 'i')
            .replaceAll('\xF1', 'n')
            .replaceAll(/[\xF2-\xF6\xF8]/g, 'o')
            .replaceAll(/[\xF9-\xFC]/g, 'u')
            .replaceAll('\xFE', 'p')
            .replaceAll(/[\xFD\xFF]/g, 'y');
    }

    return str;
}

function resolveFieldData(data, field) {
    if (data && field) {
        if (!field.includes('.')) {
            return data[field];
        }

        let fields = field.split('.');
        let value = data;

        for (let i = 0, len = fields.length; i < len; ++i) {
            if (value == null) {
                return null;
            }

            value = value[fields[i]];
        }

        return value;
    }

    return null;
}

export default async function handler(req, res) {
    const filePath = path.join(process.cwd(), 'public', 'data/customers-large.json');

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        let customers = JSON.parse(content).data;

        // get query params
        const query = url.parse(req.url, true).query.lazyEvent ? JSON.parse(url.parse(req.url, true).query.lazyEvent) : url.parse(req.url, true).query;

        // sort
        if (query.sortField && query.sortOrder) {
            customers = sort(query, customers);
        }

        // filter
        if (query.filters) {
            for (let fieldName in query.filters) {
                if (query.filters[fieldName].value !== null) {
                    customers = filter(customers, fieldName, query.filters[fieldName].value, query.filters[fieldName].matchMode);
                }
            }
        }

        res.status(200).json({
            customers: getSlice(query, customers),
            totalRecords: customers.length
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
}
