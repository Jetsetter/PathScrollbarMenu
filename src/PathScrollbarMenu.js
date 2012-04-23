var PathScrollbarMenu = new Class({

	Implements: [Options, Events],

	options: {
		degradeIE: true,
		fps: 30,
		content: '<div class="wrap">\
					<p class="closed-text">Viewing</p>\
					<div class="closed-icon"></div>\
				 </div>\
				 <div class="arrow"></div>'
	},

	initialize: function(options){
		this.setOptions(options);
		window.requestAnimFrame = function(PathScrollbarMenu){
		    return (
		        window.requestAnimationFrame       || 
		        window.webkitRequestAnimationFrame || 
		        window.mozRequestAnimationFrame    || 
		        window.oRequestAnimationFrame      || 
		        window.msRequestAnimationFrame     || 
		        function(/* function */ callback){
		            window.setTimeout(callback, 1000 / PathMenu.options.fps);
		        }
		    );
		}(this);

		this.container = new Element('div', {
			id: 'scrollbar-menu',
			'class': 'clearfix unselectable',
			'html': this.options.content
		});
		this.container.inject($(document.body));
		this.containerHeight = this.container.getSize().y;

		// super duper awesome browser animation functions (fallback is set fps as setInterval)
		window.animLoop = function(timestamp){

			// Piggyback onto this event for the general animloop (best case: ~60fps)
			this.fireEvent('animLoop');

			// Set this.hidden to true in subclass to prevent repaint while container is hidden
			if(this.scrollPosition !== window.getScroll().y && !this.hidden){
				// IE doesnt really perform well
				if(Browser.ie && this.options.degradeIE){
					clearTimeout(this.ieTimeout);
					delete this.ieTimeout;
					this.container.hide();
				}

				// Set the position of the menu
				this.setPosition();

				// Piggyback onto this event for the actual repaint of the menu (best case: ~60fps while scrolling)
				this.fireEvent('painting');
			} else {
				// IE doesnt really perform well
				if(Browser.ie && this.options.degradeIE){
					if(!this.ieTimeout){
						this.ieTimeout = setTimeout(function(){
							this.container.show();
						}.bind(this), 300);
					}
				}
			}
			requestAnimFrame(animLoop, this.container);
		}.bind(this);

		// Kickstart the drawing loop
		requestAnimFrame(animLoop, this.container);
	},

	// Originl centering code found at link below. Has been modified and changed to support fixed positioning rather than absolute -- more performant
	// http://codereview.stackexchange.com/questions/8977/anchoring-an-element-to-the-browsers-vertical-scrollbar
	setPosition: function(){
		element_offset = 0;

		var scrollbar_button_height = 15, // (depends on browser chrome, unfortunately) -- though seems to preforms alright in most situations
	    	window_height = window.getSize().y,
	    	max_target_offset = window_height - this.containerHeight,
	    	scroll_position = window.getScroll().y,
	    	body_height = document.getScrollSize().y,
		    // ratio of full body height to full height of scroll area 
		    // which does not include the buttons.
		    scroll_scale_factor = body_height / (window_height - (scrollbar_button_height * 2)),
		    offset = 0;

	    if (body_height <= window_height) { // If there's no scrollbar.
	        offset = max_target_offset / 2 - element_offset; // Position halfway down the window
	    } else {
	        offset = scrollbar_button_height 
	            + (scroll_position + window_height/2) / scroll_scale_factor; // mid-window position reduced to scroll area scale
	            - element_offset; // offset for chosen 'position' based on element height - see notes below
	    }

	    /* Some catches for when element height might mean it would get positioned outside the window */
	    if (offset < 0) { // Top bounds
	        offset = 0; // Fix it to the top of the window
	    } else if (offset > max_target_offset) { // Bottom bounds
	        offset = max_target_offset; // Fix it to the bottom of the window
	    }

	    var position = scroll_position + offset,
	    	winPer = scroll_position / body_height,
	    	newPos = (window_height - (scrollbar_button_height * 2)) * winPer,
	    	scrollbar_height = ((window_height / body_height) * window_height) - (scrollbar_button_height),
	    	push_down = (scrollbar_height - this.containerHeight) / 2 > 0 ? (scrollbar_height - this.containerHeight) / 2 : 0,
	    	setPos = newPos + push_down;
	    
	    this.container.setStyle('top', setPos);
	    this.scrollPosition = scroll_position;
	}

});