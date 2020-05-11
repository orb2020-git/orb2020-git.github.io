/**
 * This reveal.js plugin is wrapper around the highlight.js
 * syntax highlighting library.
 */
(function( root, factory ) {
    if (typeof define === 'function' && define.amd) {
        root.RevealHighlight = factory();
    } else if( typeof exports === 'object' ) {
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.RevealHighlight = factory();
    }
}( this, function() {

	// Function to perform a better "data-trim" on code snippets
	// Will slice an indentation amount on each line of the snippet (amount based on the line having the lowest indentation length)
	function betterTrim(snippetEl) {
		// Helper functions
		function trimLeft(val) {
			// Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim#Polyfill
			return val.replace(/^[\s\uFEFF\xA0]+/g, '');
		}
		function trimLineBreaks(input) {
			var lines = input.split('\n');

			// Trim line-breaks from the beginning
			for (var i = 0; i < lines.length; i++) {
				if (lines[i].trim() === '') {
					lines.splice(i--, 1);
				} else break;
			}

			// Trim line-breaks from the end
			for (var i = lines.length-1; i >= 0; i--) {
				if (lines[i].trim() === '') {
					lines.splice(i, 1);
				} else break;
			}

			return lines.join('\n');
		}

		// Main function for betterTrim()
		return (function(snippetEl) {
			var content = trimLineBreaks(snippetEl.innerHTML);
			var lines = content.split('\n');
			// Calculate the minimum amount to remove on each line start of the snippet (can be 0)
			var pad = lines.reduce(function(acc, line) {
				if (line.length > 0 && trimLeft(line).length > 0 && acc > line.length - trimLeft(line).length) {
					return line.length - trimLeft(line).length;
				}
				return acc;
			}, Number.POSITIVE_INFINITY);
			// Slice each line with this amount
			return lines.map(function(line, index) {
				return line.slice(pad);
			})
			.join('\n');
		})(snippetEl);
	}

	var RevealHighlight = {
		init: function() {

			// Read the plugin config options and provide fallbacks
			var fromPandoc = Reveal.getConfig().fromPandoc || false;
			var config = Reveal.getConfig().highlight || {};
			config.highlightOnLoad = typeof config.highlightOnLoad === 'boolean' ? config.highlightOnLoad : true;
			config.escapeHTML = typeof config.escapeHTML === 'boolean' ? config.escapeHTML : true;

			[].slice.call( document.querySelectorAll( '.reveal pre code' ) ).forEach( function( block ) {
				if (fromPandoc) {
					[].slice.call(block.parentElement.attributes).forEach(function(attr) {
						block.setAttribute(attr.nodeName, attr.nodeValue);
					});
				}
				// Trim whitespace if the "data-trim" attribute is present
				if( block.hasAttribute( 'data-trim' ) && typeof block.innerHTML.trim === 'function' ) {
					block.innerHTML = betterTrim( block );
				}

				// Escape HTML tags unless the "data-noescape" attrbute is present
				if( config.escapeHTML && !block.hasAttribute( 'data-noescape' )) {
					block.innerHTML = block.innerHTML.replace( /</g,"&lt;").replace(/>/g, '&gt;' );
				}

				// Re-highlight when focus is lost (for contenteditable code)
				block.addEventListener( 'focusout', function( event ) {
					hljs.highlightBlock( event.currentTarget );
				}, false );

				if( config.highlightOnLoad ) {
					RevealHighlight.highlightBlock( block );
				}
			} );

		},

		/**
		 * Highlights a code block. If the <code> node has the
		 * 'data-line-numbers' attribute we also generate slide
		 * numbers.
		 */
		highlightBlock: function( block ) {

			hljs.highlightBlock( block );

			if( block.hasAttribute( 'data-line-numbers' ) ) {
				hljs.lineNumbersBlock( block, { singleLine: true } );

				// hljs.lineNumbersBlock runs async code on the next cycle,
				// so we need to do the same to execute after it's done
				setTimeout( RevealHighlight.highlightLines.bind( this, block ), 0 );
			}

		},

		/**
		 * Visually emphasize specific lines within a code block.
		 * This only works on blocks with line numbering turned on.
		 *
		 * @param {HTMLElement} block a <code> block
		 * @param {String} [linesToHighlight] The lines that should be
		 * highlighted in this format:
		 * "1" 		= highlights line 1
		 * "2,5"	= highlights lines 2 & 5
		 * "2,5-7"	= highlights lines 2, 5, 6 & 7
		 */
		highlightLines: function( block, linesToHighlight ) {

			linesToHighlight = linesToHighlight || block.getAttribute( 'data-line-numbers' );

			if( typeof linesToHighlight === 'string' && linesToHighlight !== '' ) {

				linesToHighlight.split( ',' ).forEach( function( lineNumbers ) {

					// Avoid failures becase of whitespace
					lineNumbers = lineNumbers.replace( /\s/g, '' );

					// Ensure that we looking at a valid slide number (1 or 1-2)
					if( /^[\d-]+$/.test( lineNumbers ) ) {

						lineNumbers = lineNumbers.split( '-' );

						var lineStart = lineNumbers[0];
						var lineEnd = lineNumbers[1] || lineStart;

						[].slice.call( block.querySelectorAll( 'table tr:nth-child(n+'+lineStart+'):nth-child(-n+'+lineEnd+')' ) ).forEach( function( lineElement ) {
							lineElement.classList.add( 'highlight-line' );
						} );

					}

				} );

			}

		}
	}

	Reveal.registerPlugin( 'highlight', RevealHighlight );

	return RevealHighlight;

}));
