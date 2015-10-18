var Vector2d = {
	mag: function(vector) {
		return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
	},

	norm: function(vector) {
		m = this.mag(vector);
		return {x: vector.x / m, y: vector.y / m};
	},

	dist: function(a, b) {
		return this.mag({x: a.x - b.x, y: a.y - b.y});
	},

	vecFrom: function(from, to) {
		return {x: to.x - from.x, y: to.y - from.y};
	}
};