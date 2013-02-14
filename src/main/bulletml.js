/**
 * @preserve bulletml.js v0.5.0-SNAPSHOT
 *
 * License
 * http://daishihmr.mit-license.org/
 */

/** @namespace */
var bulletml = {};
/** @const */
bulletml.GLOBAL = this;
bulletml["_temp"] = function() {};

(function() {

    /**
     * bulletmlのルート要素.
     *
     * @constructor
     * @param {Object=} data
     */
    bulletml.Root = function(data) {
        /**
         * @type {string}
         */
        this.type = "none";
        /**
         * @type {bulletml.Root}
         */
        this.root = this;
        /**
         * top level action elements.
         *
         * @type {Array.<bulletml.Action>}
         */
        this.actions = [];
        /**
         * top level bullet elements.
         *
         * @type {Array.<bulletml.Bullet>}
         */
        this.bullets = [];
        /**
         * top level fire elements.
         *
         * @type {Array.<bulletml.Fire>}
         */
        this.fires = [];

        if (data !== undefined) {
            for (var prop in data) if (data.hasOwnProperty(prop)) {
                data[prop].label = prop;
                if (data[prop] instanceof bulletml.Action) {
                    this.actions.push(data[prop]);
                } else if (data[prop] instanceof bulletml.Bullet) {
                    this.bullets.push(data[prop]);
                } else if (data[prop] instanceof bulletml.Fire) {
                    this.fires.push(data[prop]);
                }
            }

            for (var i = 0, end = this.actions.length; i < end; i++) {
                this.actions[i].setRoot(this);
            }
            for (var i = 0, end = this.bullets.length; i < end; i++) {
                this.bullets[i].setRoot(this);
            }
            for (var i = 0, end = this.fires.length; i < end; i++) {
                this.fires[i].setRoot(this);
            }
        }
    };
    /**
     * find top level action element by label.
     *
     * @param {string}
     *            label label attribute value
     * @return {bulletml.Action}
     */
    bulletml.Root.prototype.findAction = function(label) {
        return search(this.actions, label);
    };
    /**
     * find actions label starts with 'top'.
     *
     * @return Array.<bulletml.Action>
     */
    bulletml.Root.prototype.getTopActionLabels = function() {
        var result = [];
        for ( var i = 0, end = this.actions.length; i < end; i++) {
            var action = this.actions[i];
            if (action.label && action.label.indexOf("top") === 0) {
                result[result.length] = action.label;
            }
        }
        return result;
    };
    /**
     * find top level action element by label. throw error if action is
     * undefined.
     *
     * @param {string}
     *            label label attribute value
     * @return {bulletml.Action}
     */
    bulletml.Root.prototype.findActionOrThrow = function(label) {
        var result;
        if (result = this.findAction(label)) {
            return result;
        } else {
            throw new Error("action labeled '" + label + "' is undefined.");
        }
    };
    /**
     * find top level bullet element by label.
     *
     * @param {string}
     *            label label attribute value
     * @return {bulletml.Bullet}
     */
    bulletml.Root.prototype.findBullet = function(label) {
        return search(this.bullets, label);
    };
    /**
     * find top level bullet element by label. throw error if bullet is
     * undefined.
     *
     * @param {string}
     *            label label attribute value
     * @return {bulletml.Bullet}
     */
    bulletml.Root.prototype.findBulletOrThrow = function(label) {
        var result;
        if (result = this.findBullet(label)) {
            return result;
        } else {
            throw new Error("bullet labeled '" + label + "' is undefined.");
        }
    };
    /**
     * find top level fire element by label.
     *
     * @param {string}
     *            label label attribute value
     * @return {bulletml.Fire}
     */
    bulletml.Root.prototype.findFire = function(label) {
        return search(this.fires, label);
    };
    /**
     * find top level fire element by label. throw error if fire is undefined.
     *
     * @param {string}
     *            label label attribute value
     * @return {bulletml.Fire}
     */
    bulletml.Root.prototype.findFireOrThrow = function(label) {
        var result;
        if (result = this.findFire(label)) {
            return result;
        } else {
            throw new Error("fire labeled '" + label + "' is undefined.");
        }
    };
    bulletml.Root.prototype.getWalker = function(actionLabel, rank) {
        var w = new bulletml.Walker(this, rank);
        var action = this.findAction(actionLabel);
        if (action) {
            w._action = action;
            return w;
        }
    };

    /**
     * @constructor
     */
    bulletml.Walker = function(root, rank) {
        this._root = root;
        /**
         * callstack.
         * @type {Array}
         */
        this._stack = [];
        /**
         * program counter.
         * @type {number}
         */
        this._cursor = -1;
        /**
         * @type {bulletml.Action}
         */
        this._action = null;
        /**
         * current localScope variables.
         * @type {Object.<string,number>}
         */
        this._localScope = {};
        /**
         * globalScope variables.
         * @type {Object.<string,number>}
         */
        this._globalScope = {
            $rank : rank || 0
        };
    };
    /**
     * @return {bulletml.Command}
     */
    bulletml.Walker.prototype.next = function() {
        this._cursor += 1;
        if (this._action !== null) {
            var n = this._action.commands[this._cursor];

            if (n !== undefined) {
                // console.log(n.commandName, n.label, this._localScope);
                if (n instanceof bulletml.Action) {
                    this.pushStack();
                    this._action = n;
                    this._localScope = this.cloneScope();
                    return this.next();
                } else if (n instanceof bulletml.ActionRef) {
                    this.pushStack();
                    this._action = this._root.findActionOrThrow(n.label);
                    this._localScope = this.newScope(n.params);
                    return this.next();
                } else if (n instanceof bulletml.Repeat) {
                    this._localScope.loopCounter = 0;
                    this._localScope.loopEnd = this.evalParam(n.times);
                    this.pushStack();
                    this._action = n.action.clone();
                    this._localScope = this.cloneScope();
                    return this.next();
                } else if (n instanceof bulletml.Fire) {
                    var f = new bulletml.Fire();
                    f.bullet = n.bullet.clone(this);
                    if (n.direction !== null) {
                        f.direction = new bulletml.Direction(this.evalParam(n.direction.value));
                        f.direction.type = n.direction.type;
                    }
                    if (n.speed !== null) {
                        f.speed = new bulletml.Speed(this.evalParam(n.speed.value));
                        f.speed.type = n.speed.type;
                    }
                    f.option = n.option;
                    return f;
                } else if (n instanceof bulletml.FireRef) {
                    this.pushStack();
                    this._action = new bulletml.Action();
                    this._action.commands = [ this._root.findFireOrThrow(n.label) ];
                    this._localScope = this.newScope(n.params);
                    return this.next();
                } else if (n instanceof bulletml.ChangeDirection) {
                    var cd = new bulletml.ChangeDirection();
                    cd.direction.type = n.direction.type;
                    cd.direction.value = this.evalParam(n.direction.value);
                    cd.term = this.evalParam(n.term);
                    return cd;
                } else if (n instanceof bulletml.ChangeSpeed) {
                    var cs = new bulletml.ChangeSpeed();
                    cs.speed.type = n.speed.type;
                    cs.speed.value = this.evalParam(n.speed.value);
                    cs.term = this.evalParam(n.term);
                    return cs;
                } else if (n instanceof bulletml.Accel) {
                    var a = new bulletml.Accel();
                    a.horizontal.type = n.horizontal.type;
                    a.horizontal.value = this.evalParam(n.horizontal.value);
                    a.vertical.type = n.vertical.type;
                    a.vertical.value = this.evalParam(n.vertical.value);
                    a.term = this.evalParam(n.term);
                    return a;
                } else if (n instanceof bulletml.Wait) {
                    return new bulletml.Wait(this.evalParam(n.value));
                } else if (n instanceof bulletml.Bind) {
                    // console.log("bind " + n.variable + " <- " + n.expression);
                    this._localScope["$" + n.variable] = this.evalParam(n.expression);
                    // console.log("    = " + this._localScope["$" + n.variable]);
                    return bulletml.DummyCommand;
                } else if (n instanceof bulletml.Notify) {
                    return n;
                } else {
                    return null;
                }
            } else {
                this.popStack();
                if (this._action === null) {
                    return null;
                }
                n = this._action.commands[this._cursor];
                if (n && n.commandName == "repeat") {
                    this._localScope.loopCounter++;
                    if (this._localScope.loopCounter < this._localScope.loopEnd) {
                        this.pushStack();
                        this._action = n.action.clone();
                        this._localScope = this.cloneScope();
                        return this.next();
                    } else {
                        return this.next();
                    }
                } else {
                    return this.next();
                }
            }
        } else {
            return null;
        }
    };
    bulletml.Walker.prototype.pushStack = function() {
        // console.log("pushStack");
        this._stack.push({
            action : this._action,
            cursor : this._cursor,
            scope : this._localScope
        });
        this._cursor = -1;
    };
    bulletml.Walker.prototype.popStack = function() {
        // console.log("popStack");
        var p = this._stack.pop();
        if (p) {
            this._cursor = p.cursor;
            this._action = p.action;
            this._localScope = p.scope;
        } else {
            this._cursor = -1;
            this._action = null;
            this._localScope = {};
        }
    };
    /**
     * @param {(number|string)} exp
     * @return {number}
     */
    bulletml.Walker.prototype.evalParam = function(exp) {
        // console.log("eval(" + exp + ")", this._localScope);
        // evalを使わずに済む場合
        var n;
        if (typeof exp === "number") {
            return exp;
        } else if (!isNaN(n = Number(exp))) {
            return n;
        } else if (n = this._localScope[exp]) {
            return n;
        } else if (n = this._globalScope[exp]) {
            return n;
        } else if (exp == "$rand") {
            return Math.random();
        }

        var scope = {};
        for ( var prop in this._globalScope) {
            if (this._globalScope.hasOwnProperty(prop)) {
                scope[prop] = this._globalScope[prop];
            }
        }
        for ( var prop in this._localScope) {
            if (this._localScope.hasOwnProperty(prop)) {
                scope[prop] = this._localScope[prop];
            }
        }
        scope.$rand = Math.random();
        var upperScope = this._stack[this._stack.length - 1];
        if (upperScope) {
            scope.$loop = {
                index: upperScope.scope.loopCounter,
                count: upperScope.scope.loopCounter + 1,
                first: upperScope.scope.loopCounter === 0,
                last: upperScope.scope.loopCounter === upperScope.scope.loopEnd - 1,
            };
        }
        // console.log(scope);
        // console.log("bulletml._temp = function() { return " + exp.split("$").join("this.$") + "}");
        var result = eval(
                "bulletml._temp = function() { return "
                        + exp.split("$").join("this.$") + "}").bind(scope)();
        // console.log(result);
        return result;
    };
    bulletml.Walker.prototype.newScope = function(params) {
        var result = {};
        if (params) {
            for ( var i = 0, end = params.length; i < end; i++) {
                result["$" + (i + 1)] = this.evalParam(params[i]);
            }
        } else {
            for ( var prop in this._localScope)
                if (this._localScope.hasOwnProperty(prop)) {
                    result[prop] = this._localScope[prop];
                }
        }
        return result;
    };
    bulletml.Walker.prototype.cloneScope = function() {
        var result = {};
        for ( var prop in this._localScope)
            if (this._localScope.hasOwnProperty(prop)) {
                result[prop] = this._localScope[prop];
            }
        return result;
    };

    /**
     * bullet要素.
     *
     * @constructor
     */
    bulletml.Bullet = function() {
        /**
         * @type {?string}
         */
        this.label = null;
        /**
         * @type {bulletml.Root}
         */
        this.root = null;
        /**
         * @type {bulletml.Direction}
         */
        this.direction = new bulletml.Direction(0);
        /**
         * @type {bulletml.Speed}
         */
        this.speed = new bulletml.Speed(1);
        /**
         * @type {Array.<bulletml.Command>}
         */
        this.actions = [];
        /**
         * @type {Object}
         */
        this.option = {};
        this._localScope = {};
    };
    bulletml.Bullet.prototype.getWalker = function(rank) {
        var w = new bulletml.Walker(this.root, rank);
        var action = new bulletml.Action();
        action.root = this.root;
        action.commands = this.actions;
        w._action = action;
        w._localScope = this._localScope;
        return w;
    };
    bulletml.Bullet.prototype.clone = function(walker) {
        var c = new bulletml.Bullet();
        c.label = this.label;
        c.root = this.root;
        c.actions = this.actions;
        c.direction = new bulletml.Direction(walker.evalParam(this.direction.value));
        c.direction.type = this.direction.type;
        c.speed = new bulletml.Speed(walker.evalParam(this.speed.value));
        c.speed.type = this.speed.type;
        c.option = this.option;
        c._localScope = walker._localScope;
        return c;
    };
    bulletml.Bullet.prototype.setRoot = function(root) {
        this.root = root;
        for (var i = 0, end = this.actions.length; i < end; i++) {
            this.actions[i].setRoot(root);
        }
    };

    /**
     * @constructor
     */
    bulletml.BulletRef = function() {
        this.root = null;
        /**
         * @type {?string}
         */
        this.label = null;
        /**
         */
        this.params = [];
    };
    bulletml.BulletRef.prototype.clone = function(walker) {
        var bkup = walker._localScope;
        walker._localScope = walker.newScope(this.params);
        var b = this.root.findBulletOrThrow(this.label).clone(walker);
        walker._localScope = bkup;
        return b;
    };
    bulletml.BulletRef.prototype.setRoot = function(root) {
        this.root = root;
    };

    // commandクラス --------------------------------------------

    /**
     * 命令を表す抽象クラス.
     *
     * Actionのcommands配列に格納される.
     *
     * @constructor
     */
    bulletml.Command = function() {
        /**
         * @type {string}
         */
        this.commandName = "";
    };
    /**
     * @param {bulletml.Root} root
     */
    bulletml.Command.prototype.setRoot = function(root) {
        this.root = root;
    };

    /**
     * @constructor
     * @extends {bulletml.Command}
     */
    bulletml.Action = function() {
        /**
         * @type {string}
         */
        this.commandName = "action";
        /**
         * @type {?string}
         */
        this.label = null;
        /**
         * @type {bulletml.Root}
         */
        this.root = null;
        /**
         * @type {Array.<bulletml.Command>}
         */
        this.commands = [];
        /**
         * @type {Array.<(string|number)>}
         */
        this.params = [];
    };
    bulletml.Action.prototype = new bulletml.Command();
    /** @inheritDoc */
    bulletml.Action.prototype.setRoot = function(root) {
        this.root = root;
        for (var i = 0, end = this.commands.length; i < end; i++) {
            this.commands[i].setRoot(root);
        }
    };
    /** @return {bulletml.Action} */
    bulletml.Action.prototype.clone = function() {
        var c = new bulletml.Action();
        c.label = this.label;
        c.root = this.root;
        c.commands = this.commands;
        return c;
    };

    /**
     * @constructor
     * @extends {bulletml.Command}
     */
    bulletml.ActionRef = function() {
        /**
         * @type {string}
         */
        this.commandName = "actionRef";
        /**
         * @type {?string}
         */
        this.label = null;
        /**
         * @type {bulletml.Root}
         */
        this.root = null;
        /**
         */
        this.params = [];
    };
    bulletml.ActionRef.prototype = new bulletml.Command();
    bulletml.ActionRef.prototype.clone = function() {
        var c = new bulletml.Action();
        c.root = this.root;
        c.commands.push(this);
        return c;
    };

    /**
     * @constructor
     * @extends {bulletml.Command}
     */
    bulletml.Fire = function() {
        /**
         * @type {string}
         */
        this.commandName = "fire";
        /**
         * @type {?string}
         */
        this.label = null;
        /**
         * @type {bulletml.Root}
         */
        this.root = null;
        /**
         * @type {bulletml.Direction}
         */
        this.direction = null;
        /**
         * @type {bulletml.Speed}
         */
        this.speed = null;
        /**
         * @type {(bulletml.Bullet|bulletml.BulletRef)}
         */
        this.bullet = null;
        /**
         * @type {bulletml.FireOption}
         */
        this.option = new bulletml.FireOption();
    };
    bulletml.Fire.prototype = new bulletml.Command();
    /** @inheritDoc */
    bulletml.Fire.prototype.setRoot = function(root) {
        this.root = root;
        // console.log("this.bullet = ", this.bullet);
        if (this.bullet) this.bullet.setRoot(root);
    };

    /**
     * @constructor
     * @extends {bulletml.Command}
     */
    bulletml.FireRef = function() {
        /**
         * @type {string}
         */
        this.commandName = "fireRef";
        /**
         * @type {?string}
         */
        this.label = null;
        /**
         */
        this.params = [];
    };
    bulletml.FireRef.prototype = new bulletml.Command();

    /**
     * @constructor
     * @extends {bulletml.Command}
     */
    bulletml.ChangeDirection = function() {
        /**
         * @type {string}
         */
        this.commandName = "changeDirection";
        /**
         */
        this.direction = new bulletml.Direction();
        /**
         */
        this.term = 0;
    };
    bulletml.ChangeDirection.prototype = new bulletml.Command();

    /**
     * @constructor
     * @extends {bulletml.Command}
     */
    bulletml.ChangeSpeed = function() {
        /**
         * @type {string}
         */
        this.commandName = "changeSpeed";
        /**
         */
        this.speed = new bulletml.Speed();
        /**
         */
        this.term = 0;
    };
    bulletml.ChangeSpeed.prototype = new bulletml.Command();

    /**
     * @constructor
     * @extends {bulletml.Command}
     */
    bulletml.Accel = function() {
        /**
         * @type {string}
         */
        this.commandName = "accel";
        /**
         */
        this.horizontal = new bulletml.Horizontal();
        /**
         */
        this.vertical = new bulletml.Vertical();
        /**
         */
        this.term = 0;
    };
    bulletml.Accel.prototype = new bulletml.Command();

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @param {(number|string)=} value
     */
    bulletml.Wait = function(value) {
        /**
         * @type {string}
         */
        this.commandName = "wait";
        /**
         * @type {(number|string)}
         */
        this.value = value || 0;
    };
    bulletml.Wait.prototype = new bulletml.Command();

    /**
     * @constructor
     * @extends {bulletml.Command}
     */
    bulletml.Vanish = function() {
        /**
         * @type {string}
         */
        this.commandName = "vanish";
    };
    bulletml.Vanish.prototype = new bulletml.Command();

    /**
     * @constructor
     * @extends {bulletml.Command}
     */
    bulletml.Repeat = function() {
        /**
         * @type {string}
         */
        this.commandName = "repeat";
        /**
         * @type {(number|string)}
         */
        this.times = 0;
        /**
         * @type {(bulletml.Action||bulletml.ActionRef)}
         */
        this.action = null;
        /**
         * @type {Array.<(string|number)>}
         */
        this.params = [];
    };
    bulletml.Repeat.prototype = new bulletml.Command();
    bulletml.Repeat.prototype.setRoot = function(root) {
        this.root = root;
        if (this.action) this.action.setRoot(root);
    };

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @param {string} variable
     * @param {(string|number)} expression
     */
    bulletml.Bind = function(variable, expression) {
        /**
         * @type {string}
         */
        this.commandName = "bind";
        this.variable = variable;
        this.expression = expression;
    };
    bulletml.Bind.prototype = new bulletml.Command();

    /**
     * @constructor
     * @param {string} eventName
     * @param {?Array} params
     */
    bulletml.Notify = function(eventName, params) {
        this.commandName = "notify";
        this.eventName = eventName;
        this.params = params || null;
    };
    bulletml.Notify.prototype = new bulletml.Command();

    bulletml.DummyCommand = new bulletml.Command();

    // valueクラス -----------------------------------------------

    /**
     * @constructor
     * @param {(number|string)=} value
     */
    bulletml.Direction = function(value) {
        /**
         * @type {string}
         */
        this.type = "aim";
        /**
         * @type {(string|number)}
         */
        this.value = value || 0;
    };

    /**
     * @constructor
     * @param {(number|string)=} value
     */
    bulletml.Speed = function(value) {
        /**
         * @type {string}
         */
        this.type = "absolute";
        /**
         * @type {(string|number)}
         */
        this.value = (value === undefined) ? 1 : value;
    };

    /**
     * @constructor
     * @param {(number|string)=} value
     */
    bulletml.Horizontal = function(value) {
        /**
         * @type {string}
         */
        this.type = "absolute";
        /**
         * @type {(string|number)}
         */
        this.value = value || 0;
    };

    /**
     * @constructor
     * @param {(number|string)=} value
     */
    bulletml.Vertical = function(value) {
        /**
         * @type {string}
         */
        this.type = "absolute";
        /**
         * @type {(string|number)}
         */
        this.value = value || 0;
    };

    /**
     * @constructor
     * @param {Object=} params
     */
    bulletml.FireOption = function(params) {
        params = params || {};

        /**
         * @type {number}
         */
        this.offsetX = params.offsetX || 0;
        /**
         * @type {number}
         */
        this.offsetY = params.offsetY || 0;
        /**
         * @type {boolean}
         */
        this.autonomy = true;
        if (params.autonomy !== undefined) {
            this.autonomy = !!params.autonomy;
        }
    };

    /**
     * @constructor
     * @param {number=} value
     */
    bulletml.OffsetX = function(value) {
        this.value = value || 0;
    };
    /**
     * @constructor
     * @param {number=} value
     */
    bulletml.OffsetY = function(value) {
        this.value = value || 0;
    };
    /**
     * @constructor
     * @param {boolean=} value
     */
    bulletml.Autonomy = function(value) {
        this.value = !!value;
    };

    // utility ---------------------------------------------------

    /**
     * @param {Array.<(bulletml.Bullet|bulletml.Action|bulletml.Fire)>} array
     * @param {string} label
     */
    function search(array, label) {
        for ( var i = 0, end = array.length; i < end; i++) {
            if (array[i].label == label) {
                return array[i];
            }
        }
    }

})();

// 互換性維持
var BulletML = bulletml;
