var Entity = function(x, y, rad) {
	this.x = x;
	this.y = y;

	this.xvel = 0;
	this.yvel = 0;

	this.xacc = 0;
	this.yacc = 0;

	this.mass = 1;
	this.rad = rad;
};

Entity.prototype.apply_force = function(x, y) {
	this.xacc += x;
	this.yacc += y;
};

Entity.prototype.update = function() {

	this.xvel += this.xacc / this.mass;
	this.yvel += this.yacc / this.mass;

	this.xacc = 0;
	this.yacc = 0;

	this.x += this.xvel;
	this.y += this.yvel;
};

var Player = function(x, y, rad) {
	this.x = x;
	this.y = y;
	this.rad = rad;
	this.linkedTo = -1;
	this.fragments = 0;
};

Player.prototype = new Entity();

var Light = function(x, y, rad, grav) {
	this.x = x;
	this.y = y;
	this.rad = rad;
	this.grav = grav
};

Light.prototype = new Entity();

