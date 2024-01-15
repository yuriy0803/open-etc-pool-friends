/*
Template Name: Cyber Pool Responsive Template
Author: Cyber Harry
Email: cyberharry@cyberpool.org
File: app.js
*/

$(function () {
	"use strict";
	$(".search-btn-mobile").on("click", function () {
		$(".search-bar").addClass("full-search-bar");
	});
	$(".search-arrow-back").on("click", function () {
		$(".search-bar").removeClass("full-search-bar");
	});
	$(document).ready(function () {
		$(window).on("scroll", function () {
			if ($(this).scrollTop() > 60) {
				$('.top-header').addClass('bg-dark');
				$('.nav-container').addClass('bg-dark sticky-top-header');
			} else {
				$('.top-header').removeClass('bg-dark');
				$('.nav-container').removeClass('bg-dark sticky-top-header');
			}
		});
		$('.back-to-top').on("click", function () {
			$("html, body").animate({
				scrollTop: 0
			}, 600);
			return false;
		});
	});
	$(function () {
		$('.metismenu-card').metisMenu({
			toggle: false,
			triggerElement: '.card-header',
			parentTrigger: '.card',
			subMenu: '.card-body'
		});
	});

	$(function () {
		$('[data-toggle="tooltip"]').tooltip()
	})

	$(function () {
		$('.card-collapse').metisMenu({
			toggle: false,
			triggerElement: '.card-header',
			parentTrigger: '.card',
			subMenu: '.card-body'
		});
	});

	if ($('#webticker').length) {   
		$("#webticker").webTicker({
			height:'auto', 
			duplicate:true,
			startEmpty:false, 
			rssfrequency:5,
			direction: 'left'
		});
	}

	$(".toggle-btn").click(function () {
		if ($(".wrapper").hasClass("toggled")) {
			// unpin sidebar when hovered
			$(".wrapper").removeClass("toggled");
			$(".sidebar-wrapper").unbind("hover");
		} else {
			$(".wrapper").addClass("toggled");
			$(".sidebar-wrapper").hover(function () {
				$(".wrapper").addClass("sidebar-hovered");
			}, function () {
				$(".wrapper").removeClass("sidebar-hovered");
			})
		}
	});
	
	$(".toggle-btn-mobile").on("click", function () {
		$(".wrapper").removeClass("toggled");
	});

	$(function () {
		for (var i = window.location, o = $(".metismenu li a").filter(function () {
			return this.href == i;
		}).addClass("").parent().addClass("");;) {
			if (!o.is("li")) break;
			o = o.parent("").addClass("").parent("").addClass("");
		}
	}),

	$(function () {
		$('#menu').metisMenu();
	});

	$(document).ready(function () {
		$(window).on("scroll", function () {
			if ($(this).scrollTop() > 300) {
				$('.back-to-top').fadeIn();
			} else {
				$('.back-to-top').fadeOut();
			}
		});
		$('.back-to-top').on("click", function () {
			$("html, body").animate({
				scrollTop: 0
			}, 600);
			return false;
		});
	});
});