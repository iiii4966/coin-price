export class BaseCache extends Array {
    constructor(maxSize = undefined) {
        super();
        Object.defineProperty(this, 'maxSize', {
            __proto__: null,
            value: maxSize,
            writable: true,
        });
    }
    clear() {
        this.length = 0;
    }
}

export class ArrayCache extends BaseCache {
    constructor(maxSize = undefined) {
        super(maxSize);
        Object.defineProperty(this, 'nestedNewUpdatesBySymbol', {
            __proto__: null,
            value: false,
            writable: true,
        });
        Object.defineProperty(this, 'newUpdatesBySymbol', {
            __proto__: null,
            value: {},
            writable: true,
        });
        Object.defineProperty(this, 'clearUpdatesBySymbol', {
            __proto__: null,
            value: {},
            writable: true,
        });
        Object.defineProperty(this, 'allNewUpdates', {
            __proto__: null,
            value: 0,
            writable: true,
        });
        Object.defineProperty(this, 'clearAllUpdates', {
            __proto__: null,
            value: false,
            writable: true,
        });
    }
    getLimit(symbol, limit) {
        let newUpdatesValue = undefined;
        if (symbol === undefined) {
            newUpdatesValue = this.allNewUpdates;
            this.clearAllUpdates = true;
        }
        else {
            newUpdatesValue = this.newUpdatesBySymbol[symbol];
            if ((newUpdatesValue !== undefined) && this.nestedNewUpdatesBySymbol) {
                newUpdatesValue = newUpdatesValue.size;
            }
            this.clearUpdatesBySymbol[symbol] = true;
        }
        if (newUpdatesValue === undefined) {
            return limit;
        }
        else if (limit !== undefined) {
            return Math.min(newUpdatesValue, limit);
        }
        else {
            return newUpdatesValue;
        }
    }
    append(item) {
        // maxSize may be 0 when initialized by a .filter() copy-construction
        if (this.maxSize && (this.length === this.maxSize)) {
            this.shift();
        }
        this.push(item);
        if (this.clearAllUpdates) {
            this.clearAllUpdates = false;
            this.clearUpdatesBySymbol = {};
            this.allNewUpdates = 0;
            this.newUpdatesBySymbol = {};
        }
        if (this.clearUpdatesBySymbol[item.symbol]) {
            this.clearUpdatesBySymbol[item.symbol] = false;
            this.newUpdatesBySymbol[item.symbol] = 0;
        }
        this.newUpdatesBySymbol[item.symbol] = (this.newUpdatesBySymbol[item.symbol] || 0) + 1;
        this.allNewUpdates = (this.allNewUpdates || 0) + 1;
    }
}