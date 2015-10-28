(function() {

	// var canvas = document.getElementById('canvas');
	// var context = canvas.getContext('2d');

	var renderer = new PIXI.WebGLRenderer(640, 480);

	document.body.appendChild(renderer.view);

	var stage = new PIXI.Container();

	var bloom_filter = new PIXI.filters.BloomFilter();
	bloom_filter.blur = 8;

	stage.filters = [bloom_filter];

	var lights = [];

	var particles = [];

	for(var i=0; i< 50; i++) {
		particles.push(new Entity(Math.random() * 640, Math.random() * 480, 1));
	}

	var friction = 0.01;

	var gametime =  1; // initial game time, gets incremented every update

	var captureDistance = 100;

	var attractForceFactor = 0.02;

	var repelForceFactor = 0.02;

	var repelDistance = 50;

	var mapWidth = 1000;
	var mapHeight = 1000;

	var screenWidth = 640;//canvas.width;
	var screenHeight = 480;//canvas.height;

	var player = new Player(320, 240, 10);
	var camera = new Entity(0, 0, 0);

	lights.push(new Entity(100, 100, 10));
	lights.push(new Entity(150, 150, 10));

	console.log(lights);

	var InputHandler = function() {
		this.pressed_keys = {
			up: false,
			down: false,
			left: false,
			right: false,
			space: false
		};

		this.key_codes = {
			37: 'left',
			38: 'up',
			39: 'right',
			40: 'down',
			32: 'space',

			65: 'left',
			87: 'up',
			83: 'down',
			68: 'right'
		};
	};

	var inputHandler = new InputHandler();

	window.onkeydown = function(event) {
		inputHandler.pressed_keys[inputHandler.key_codes[event.keyCode]] = true;
	};

	window.onkeyup = function(event) {
		inputHandler.pressed_keys[inputHandler.key_codes[event.keyCode]] = false;
	};

	var tick = function() {
		if(inputHandler.pressed_keys['up']) {
			player.apply_force(0, -0.4);
			camera.apply_force(0, -0.4);
		}

		if(inputHandler.pressed_keys.down) {
			player.apply_force(0, 0.4);
			camera.apply_force(0, 0.4);
		}

		if(inputHandler.pressed_keys.left) {
			player.apply_force(-0.4, 0);
			camera.apply_force(-0.4, 0);
		}

		if(inputHandler.pressed_keys.right) {
			player.apply_force(0.4, 0);
			camera.apply_force(0.4, 0);
		}

		//apply wind force
		var wind_force = get_wind_force(Math.random() * 0.2 - 0.1);
		player.apply_force(wind_force.x, wind_force.y);

		//apply friction
		var friction_force = {x: -player.xvel * friction, y: -player.yvel * friction};
		player.apply_force(friction_force.x, friction_force.y);

		for(var i=0; i<particles.length; i++) {
			var particle_friction = {x: -particles[i].xvel * friction, y: -particles[i].yvel * friction};
			particles[i].apply_force(particle_friction.x, particle_friction.y);
			particles[i].apply_force(Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05);
			particles[i].update();
		}

		player.update();
		update_lights();

		update_game();
		
		camera.x = player.x - 320;
		camera.y = player.y - 240;

	};

	var get_wind_force = function(x) {
		// Math.sin(gametime); // have a max gametime here so we can normalise a wind vector
		// return {x: 0.01 * gametime, y: 0}; // wind direction random?
		return {x: Math.sin(x), y: Math.sin(x)};
	};

	var update_lights = function() {
		for(var i=0; i<lights.length; i++) {
			//apply friction
			var friction_force = {x: -lights[i].xvel * friction, y: -lights[i].yvel * friction};
			lights[i].apply_force(friction_force.x, friction_force.y);
			lights[i].update();
		}
	}

	var update_camera = function() {

		var camX = camera.x + (screenWidth / 2);
		var camY = camera.y + (screenHeight / 2);
		console.log({X: camX, Y:camY});

		var dist = Math.sqrt(Math.pow(camX - player.x, 2) + Math.pow(camY - player.y, 2));

		var factor = dist * 0.001;


		if(dist > 10) {
			var normX = (player.x - camX) / dist;
			var normY = (player.y - camY) / dist;

			camera.apply_force(normX * factor, normY * factor);
			camera.update();
		}
	}

	//check if player is in range of any fragments
	var collect_fragments = function() {
		for(var i=0; i<particles.length; i++) {
			if(Vector2d.dist(player, particles[i]) <= player.rad) {
				console.log(player.fragments);
				player.fragments ++;
				particles[i].x = Math.random() * screenWidth;
				particles[i].y = Math.random() * screenHeight;
			}
		}
	}

	var update_game = function() {

		gametime += 0.1;

		//check if the player SHOULD still be linked to the light
		if(player.linkedTo > -1) {
			var linkedDist = Vector2d.dist(lights[player.linkedTo], player);
			if(linkedDist > captureDistance) {
				player.linkedTo = -1;
				player.fragments = 0; //you loose your fragments if you loose connection
				player.timeOfLoss = gametime;
			}
		}

		var linked = player.linkedTo > -1;

		//if the player is unlinked, check proximity to all lightsparticles
		if(!linked) {
			for(var i=0; i<lights.length && !linked; i++) {
				var dist = Vector2d.dist(lights[i], player);
				if(dist <= captureDistance) {
					console.log("close enough!!")
					player.linkedTo = i;
					linked = true;
				}
			}
		}

		//if player IS linked, apply forces where nessecary
		if(player.linkedTo > -1) {
			collect_fragments();
			var link = player.linkedTo;
			var dist = Vector2d.dist(lights[link], player);
			
			if(dist <= repelDistance) {
				var repelForce = Vector2d.norm(Vector2d.vecFrom(player, lights[link]));// * repelForceFactor;
				lights[link].apply_force(repelForce.x * repelForceFactor, 
										repelForce.y * repelForceFactor);
			} else {
				var attractForce = Vector2d.norm(Vector2d.vecFrom(lights[link], player));// * attractForceFactor;
				lights[link].apply_force(attractForce.x * attractForceFactor * player.fragments, 
										attractForce.y * attractForceFactor * player.fragments);
			}
			// var attractForce = Vector2d.norm(Vector2d.vecFrom(lights[link], player));// * attractForceFactor;
			// lights[link].apply_force(attractForce.x * attractForceFactor * player.fragments, 
			// attractForce.y * attractForceFactor * player.fragments);
		}
	};

	// var render = function() {
	// 	context.beginPath();
	// 	context.rect(0, 0, 640, 480);
	// 	context.fillStyle = 'black';
	// 	context.fill();

	// 	var blueSaturation = 0;

	// 	if(player.linkedTo == -1 && blueSaturation < 100) {
	// 		blueSaturation = Math.ceil(gametime - player.timeOfLoss);
	// 		console.log(blueSaturation);
	// 	}

	// 	context.fillStyle = 'rgb('+(100 + player.fragments * 5 - blueSaturation) +','+(100 + player.fragments * 5 - blueSaturation)+','+0+')';
	// 	context.beginPath();
	// 	context.arc(player.x - camera.x, player.y - camera.y, player.rad - blueSaturation * 0.01, 0, 2* Math.PI, false);
	// 	context.fill();

	// 	context.fillStyle = 'yellow';

	// 	//draw light placeholders
	// 	for(var i = 0; i< lights.length; i++) {
	// 		context.beginPath();
	// 		context.arc(lights[i].x - camera.x, lights[i].y - camera.y, lights[i].rad, 0, 2* Math.PI, false);
	// 		context.fill();
	// 	}

	// 	//draw particle placeholders
	// 	for(var i = 0; i<particles.length; i++) {
	// 		context.beginPath();
	// 		context.arc((particles[i].x - camera.x) /**% screenWidth**/, 
	// 					(particles[i].y - camera.y) /**% screenHeight**/, 
	// 					particles[i].rad, 0, 2 * Math.PI, false);
	// 		context.fill();
	// 	}

	// 	//draw link placeholder
	// 	// if(player.linkedTo > -1) {
	// 	// 	context.lineWidth = 1;
	// 	// 	context.strokeStyle = 'yellow';
	// 	// 	context.beginPath();
	// 	// 	context.moveTo(player.x - camera.x, player.y - camera.y);
	// 	// 	context.lineTo(lights[player.linkedTo].x - camera.x, lights[player.linkedTo].y - camera.y);
	// 	// 	context.stroke();
	// 	// }
	// };

	setInterval(function() {
		tick();
		// render();
	}, 1000 / 30);

	var playerCirlceGraphics = new PIXI.Graphics();
	var fragmentGraphics = new PIXI.Graphics();
	var lightGraphics = new PIXI.Graphics();

	stage.addChild(playerCirlceGraphics);

	stage.addChild(fragmentGraphics);

	stage.addChild(lightGraphics);

	var animate = function() {

		playerCirlceGraphics.clear();
		playerCirlceGraphics.lineStyle(0);
		playerCirlceGraphics.beginFill(0xFFFF00, 1);
		playerCirlceGraphics.drawCircle(player.x - camera.x, player.y - camera.y ,player.rad );
		playerCirlceGraphics.endFill();

		fragmentGraphics.clear();
		fragmentGraphics.lineStyle(0);
		fragmentGraphics.beginFill(0xFFFF00, 1);

		for(var i = 0; i < particles.length; i++) {
			fragmentGraphics.drawCircle(particles[i].x - camera.x, particles[i].y - camera.y, particles[i].rad);
		}

		fragmentGraphics.endFill();

		renderer.render(stage);
		requestAnimationFrame(animate);
	};

	animate();

})();
