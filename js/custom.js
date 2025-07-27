/* =====================================
All JavaScript fuctions Start
======================================*/

(function ($) {

	'use strict';
	/*--------------------------------------------------------------------------------------------
		document.ready ALL FUNCTION START
	---------------------------------------------------------------------------------------------*/


	// > TouchSpin box function by  = jquery.bootstrap-touchspin.js =============== // 
	function input_number_vertical_form() {
		jQuery("input[name='demo_vertical2']").TouchSpin({
			verticalbuttons: true,
			verticalupclass: 'fa fa-plus',
			verticaldownclass: 'fa fa-minus'
		});
	}


	//________Video responsive function by = custom.js________//	

	function video_responsive() {
		jQuery('iframe[src*="youtube.com"]').wrap('<div class="embed-responsive embed-responsive-16by9"></div>');
		jQuery('iframe[src*="vimeo.com"]').wrap('<div class="embed-responsive embed-responsive-16by9"></div>');
	}


	//________magnificPopup function	by = magnific-popup.js________//	

	function magnific_popup() {
		jQuery('.mfp-gallery').magnificPopup({
			delegate: '.mfp-link',
			type: 'image',
			tLoading: 'Loading image #%curr%...',
			mainClass: 'mfp-img-mobile',
			gallery: {
				enabled: true,
				navigateByImgClick: true,
				preload: [0, 1] // Will preload 0 - before current, and 1 after the current image
			},
			image: {
				tError: '<a href="%url%">The image #%curr%</a> could not be loaded.',
			}
		});
	}


	//________ magnificPopup for video function	by = magnific-popup.js________//	

	function magnific_video() {
		jQuery('.mfp-video').magnificPopup({
			type: 'iframe',
		});
	}


	//________Vertically center Bootstrap modal popup function by = custom.js________//	

	function popup_vertical_center() {
		jQuery(function () {
			function reposition() {
				var modal = jQuery(this),
					dialog = modal.find('.modal-dialog');
				modal.css('display', 'block');
				// Dividing by two centers the modal exactly, but dividing by three 
				// or four works better for larger screens.
				dialog.css("margin-top", Math.max(0, (jQuery(window).height() - dialog.height()) / 2));
			}
			// Reposition when a modal is shown
			jQuery('.modal').on('show.bs.modal', reposition);
			// Reposition when the window is resized
			jQuery(window).on('resize', function () {
				jQuery('.modal:visible').each(reposition);
			});
		});
	}




	//________page scroll top on button click function by = custom.js________//	

	function scroll_top() {
		jQuery("button.scroltop").on('click', function () {
			jQuery("html, body").animate({
				scrollTop: 0
			}, 1000);
			return false;
		});

		jQuery(window).on("scroll", function () {
			var scroll = jQuery(window).scrollTop();
			if (scroll > 900) {
				jQuery("button.scroltop").fadeIn(1000);
			} else {
				jQuery("button.scroltop").fadeOut(1000);
			}
		});
	}


	//________graph images moving function by = jquery.bgscroll.js	________//	
	function bg_moving() {
		jQuery(function () {
			jQuery('.bg-moving').bgscroll({ scrollSpeed: 20, direction: 'h' });
		});
	}


	//________ footer fixed on bottom function by = custom.js________//	

	function footer_fixed() {
		jQuery('.site-footer').css('display', 'block');
		jQuery('.site-footer').css('height', 'auto');
		var footerHeight = jQuery('.site-footer').outerHeight();
		jQuery('.footer-fixed > .page-wraper').css('padding-bottom', footerHeight);
		jQuery('.site-footer').css('height', footerHeight);
	}


	//________STICKY MENU WHEN SCROLL DOWN________//	

	function sticky_header() {
		if (jQuery('.sticky-header').length) {
			var sticky = new Waypoint.Sticky({
				element: jQuery('.sticky-header')
			})
		}
	}
	//________accordion active calss function by = custom.js________//	

	function accordion_active() {
		$('.acod-head a').on('click', function () {
			$('.acod-head').removeClass('acc-actives');
			$(this).parents('.acod-head').addClass('acc-actives');
			$('.acod-title').removeClass('acc-actives'); //just to make a visual sense
			$(this).parent().addClass('acc-actives'); //just to make a visual sense
			($(this).parents('.acod-head').attr('class'));
		});
	}


	//________Nav submenu show hide on mobile by = custom.js________//
	function mobile_nav() {
		jQuery(".sub-menu, .mega-menu").parent('li').addClass('has-child');
		jQuery("<div class='fa fa-angle-right submenu-toogle'></div>").insertAfter(".has-child > a");

		jQuery('.has-child a+.submenu-toogle').on('click', function (ev) {

			jQuery(this).parent().siblings(".has-child ").children(".sub-menu, .mega-menu").slideUp(500, function () {
				jQuery(this).parent().removeClass('nav-active');
			});

			jQuery(this).next(jQuery('.sub-menu, .mega-menu ')).slideToggle(500, function () {
				jQuery(this).parent().toggleClass('nav-active');
			});

			ev.stopPropagation();
		});

	}

	//________Mobile side drawer function by = custom.js________//
	function mobile_side_drawer() {
		jQuery('#mobile-side-drawer').on('click', function () {
			jQuery('.mobile-sider-drawer-menu').toggleClass('active');
		});
	}


	//________Home page testimonial function by = owl.carousel.js________//	

	function testimonial_home() {
		jQuery('.testimonial-home').owlCarousel({
			loop: true,
			autoplay: true,
			margin: 30,
			autoplayTimeout: 6000,
			nav: false,
			dots: true,
			navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
			responsive: {
				0: {
					items: 1
				},
				991: {
					items: 1
				}
			}
		});
	}

	//________Home page testimonial function by = owl.carousel.js________//	

	function testimonial_home_two() {
		jQuery('.testimonial-home-two').owlCarousel({
			loop: true,
			autoplay: false,
			margin: 30,
			nav: true,
			dots: false,
			navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
			responsive: {
				0: {
					items: 1
				},
				991: {
					items: 2
				}
			}
		});
	}

	//________Home page testimonial function by = owl.carousel.js________//	

	function about_home() {
		jQuery('.about-home').owlCarousel({
			loop: true,
			autoplay: true,
			margin: 30,
			nav: true,
			dots: true,
			navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
			responsive: {
				0: {
					items: 1
				},
				991: {
					items: 1
				}
			}
		});
	}



	//________ Project carousel  function by = owl.carousel.js________//	

	function project_carousel4() {
		jQuery('.project-carousel4').owlCarousel({
			loop: true,
			autoplay: false,
			center: false,
			items: 3,
			margin: 40,
			nav: true,
			dots: false,
			navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
			responsive: {
				0: {
					items: 1,
					margin: 15
				},
				640: {
					items: 2,
					margin: 15
				},
				800: {
					items: 3,
					margin: 20,
				},
				1200: {
					items: 4
				}

			}
		});
	}



	//________ Project carousel  function by = owl.carousel.js________//	

	function project_carousel1() {
		jQuery('.project-carousel1').owlCarousel({
			loop: true,
			autoplay: false,
			center: false,
			items: 3,
			margin: 40,
			nav: true,
			dots: true,
			navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
			responsive: {
				0: {
					items: 1
				},
				768: {
					items: 1
				},
				991: {
					items: 1
				}


			}
		});
	}

	//________ Projects carousel  function by = owl.carousel.js________//	

	function home_projects_filter() {

		var owl = jQuery('.owl-carousel-filter').owlCarousel({
			loop: false,
			autoplay: false,
			margin: 30,
			nav: true,
			dots: false,
			navText: ['Предыдущий', 'Следующий'],
			responsive: {
				0: {
					items: 1,
				},
				540: {
					items: 2,
				},
				768: {
					items: 3,
				},
				991: {
					items: 3
				},
				1136: {
					items: 4
				},
				1366: {
					items: 5
				}
			}
		})

		/* Filter Nav */

		jQuery('.btn-filter-wrap').on('click', '.btn-filter', function (e) {
			var filter_data = jQuery(this).data('filter');

			/* return if current */
			if (jQuery(this).hasClass('btn-active')) return;

			/* active current */
			jQuery(this).addClass('btn-active').siblings().removeClass('btn-active');

			/* Filter */
			owl.owlFilter(filter_data, function (_owl) {
				jQuery(_owl).find('.item').each(owlAnimateFilter);
			});
		})



	}
	


	function contact_slide() {
		jQuery('.contact-slide-show').on('click', function () {
			jQuery('.contact-slide-hide').animate({ 'right': '0px' });
		});
		jQuery('.contact_close').on('click', function () {
			jQuery('.contact-slide-hide').animate({ 'right': '100%' });
		});
	};


	// ________ Fade slider function by = owl.carousel.js ========================== //
	function owl_fade_slider() {
		jQuery('.owl-fade-slider-one').owlCarousel({
			loop: true,
			autoplay: true,
			autoplayTimeout: 2000,
			margin: 30,
			nav: true,
			navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
			items: 1,
			dots: false,
			animateOut: 'fadeOut',

		})
	}
	//________  Sidebar sticky  when scroll down function by = theia-sticky-sidebar.js ========== //		
	function sticky_sidebar() {
		$('.sticky_column')
			.theiaStickySidebar({
				additionalMarginTop: 100
			});
	}

	//________ Counter Up  function by = counterup.min.js ========== //		
	function counter_up() {
		jQuery('.counter').counterUp({
			delay: 10,
			time: 5000
		});

	}

	//________ Login Signup Form function by = custom.js ________//		





	/*--------------------------------------------------------------------------------------------
		Window on load ALL FUNCTION START
	---------------------------------------------------------------------------------------------*/

	//________equal each box function by  = custom.js________//	

	function equalheight(container) {
		var currentTallest = 0,
			currentRowStart = 0,
			rowDivs = new Array(),
			$el, topPosition = 0,
			currentDiv = 0;

		jQuery(container).each(function () {
			$el = jQuery(this);
			jQuery($el).height('auto');
			var topPostion = $el.position().top;
			if (currentRowStart != topPostion) {
				for (currentDiv = 0; currentDiv < rowDivs.length; currentDiv++) {
					rowDivs[currentDiv].height(currentTallest);
				}
				rowDivs.length = 0; // empty the array
				currentRowStart = topPostion;
				currentTallest = $el.height();
				rowDivs.push($el);
			} else {

				rowDivs.push($el);
				currentTallest = (currentTallest < $el.height()) ? ($el.height()) : (currentTallest);
			}

			for (currentDiv = 0; currentDiv < rowDivs.length; currentDiv++) {
				rowDivs[currentDiv].height(currentTallest);
			}
		});
	}




	//________masonry function function by = isotope.pkgd.min.js________//	

	function masonryBox() {
		if (jQuery().isotope) {
			var $container = jQuery('.masonry-outer');
			$container.isotope({
				itemSelector: '.masonry-item',
				transitionDuration: '1s',
				originLeft: true,
				stamp: '.stamp',
			});

			jQuery('.masonry-filter li').on('click', function () {
				var selector = jQuery(this).find("a").attr('data-filter');
				jQuery('.masonry-filter li').removeClass('active');
				jQuery(this).addClass('active');
				$container.isotope({ filter: selector });
				return false;
			});
		};
	}


	//________background image parallax function by = stellar.js ________//		
	function bg_image_stellar() {
		jQuery(function () {
			jQuery.stellar({
				horizontalScrolling: false,
				verticalOffset: 100
			});
		});
	}


	//________page loader function by = custom.js________//	

	function page_loader() {
		$('.loading-area').fadeOut(1000)
	};


	//________skills bar function function by  = custom.js ________//	


	/* 2.1 skills bar tooltips*/
	function progress_bar_tooltips() {
		jQuery(function () {
			jQuery('[data-toggle="tooltip"]').tooltip({ trigger: 'manual' }).tooltip('show');
		});
	}

	/* 2.2 skills bar widths*/

	function progress_bar_width() {
		jQuery(window).on('scroll', function () {
			jQuery(".progress-bar").each(function () {
				progress_bar_width = jQuery(this).attr('aria-valuenow');
				jQuery(this).width(progress_bar_width + '%');
			});
		});
	}


	/*--------------------------------------------------------------------------------------------
		Window on scroll ALL FUNCTION START
	---------------------------------------------------------------------------------------------*/

	function color_fill_header() {
		var scroll = $(window).scrollTop();
		if (scroll >= 100) {
			$(".is-fixed").addClass("color-fill");
		} else {
			$(".is-fixed").removeClass("color-fill");
		}
	};

	/*--------------------------------------------------------------------------------------------
		document.ready ALL FUNCTION START
	---------------------------------------------------------------------------------------------*/
	jQuery(document).ready(function () {
		//  Shop Product Price Range Slider function by = bootstrap-slider.min.js ========================== //

			// > TouchSpin box function by  = jquery.bootstrap-touchspin.js =============== // 
			input_number_vertical_form(),
		
			
			contact_slide(),
			//________  Sidebar sticky  when scroll down function by = theia-sticky-sidebar.js ========== //		
			sticky_sidebar(),
			//________ Counter Up  function by = counterup.min.js ========== //		
			counter_up(),
			//________graph images moving function by = jquery.bgscroll.js	________//	
			bg_moving()
		//________Video responsive function by = custom.js ________//	
		video_responsive(),
			//________magnificPopup function	by = magnific-popup.js________//	
			magnific_popup(),
			//________magnificPopup for video function	by = magnific-popup.js________//	
			magnific_video(),
			//________Vertically center Bootstrap modal popup function by = custom.js________//	
			popup_vertical_center();
		//________Main menu sticky on top  when scroll down function by = custom.js	________//		
		sticky_header(),
			//________page scroll top on button click function by = custom.js________//		
			scroll_top(),
			//________footer fixed on bottom function by = custom.js________//		
			footer_fixed(),
			//________accordion active calss function by = custom.js ________//	
			accordion_active(),
			//________ Nav submenu on off function by = custome.js________//	
			mobile_nav(),
			//________Mobile side drawer function by = custom.js________//
			mobile_side_drawer(),
			//________Home page testimonial function by = owl.carousel.js________//	
			testimonial_home(),
			//________Home page testimonial function by = owl.carousel.js________//	
			testimonial_home_two(),
			//________Home page testimonial function by = owl.carousel.js________//	
			about_home()


	});

	/*--------------------------------------------------------------------------------------------
		Window Load START
	---------------------------------------------------------------------------------------------*/
	jQuery(window).on('load', function () {
		//________equal each box function by  = custom.js________//				
		equalheight(".equal-wraper .equal-col"),
			//________masonry function function by = isotope.pkgd.min.js________//			
			masonryBox(),
			//________background image parallax function by = stellar.js	________//	
			bg_image_stellar(),
			//________page loader function by = custom.js________//			
			page_loader(),
			//________project carousel  function by = owl.carousel.js________//	
			project_carousel4()
		//________project carousel  function by = owl.carousel.js________//	
		project_carousel1()
		//________Projects carousel  function by = owl.carousel.js________//	
		home_projects_filter()
		// ________ Fade slider function by = owl.carousel.js ========================== //
		owl_fade_slider()
		//________skills bar function function by  = custom.js________//				
		progress_bar_tooltips(),
			//________skills bar function function by  = custom.js________//			
			progress_bar_width()
	});

	/*===========================
	   Window Scroll ALL FUNCTION START
   ===========================*/

	jQuery(window).on('scroll', function () {
		//________Window on scroll header color fill________//	 
		color_fill_header()

	});

	/*===========================
		Window Resize ALL FUNCTION START
	===========================*/

	jQuery(window).on('resize', function () {
		//________ footer fixed on bottom function by = custom.js	________//		 
		footer_fixed(),
			equalheight(".equal-wraper .equal-col")
	});




	//________Switcher panal slide function END	________//	




})(jQuery);