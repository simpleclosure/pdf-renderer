import { expect } from 'vitest';
import path from 'path';
import url from 'url';
import { configureToMatchImageSnapshot } from 'jest-image-snapshot';
import React from 'react';
import ReactDOM from 'react-dom';

// Set up jsdom environment for PDF.js
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p><canvas id="canvas"></canvas>`, {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});
global.document = dom.window.document;
global.window = dom.window;

// Add missing browser APIs
global.window.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};
global.window.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Make Image available globally for PDF.js
try {
  const { Image: CanvasImage } = require('canvas');
  
  // Create a wrapper that works better with PDF.js
  class PDFCompatibleImage extends CanvasImage {
    constructor() {
      super();
      this._loaded = false;
    }
    
    set src(value) {
      super.src = value;
      // For PDF.js compatibility, simulate immediate loading for data URLs
      if (value && typeof value === 'string' && value.startsWith('data:')) {
        // Simulate immediate loading
        setTimeout(() => {
          this.width = this.width || 100;
          this.height = this.height || 100;
          this.naturalWidth = this.naturalWidth || this.width;
          this.naturalHeight = this.naturalHeight || this.height;
          this.complete = true;
          this._loaded = true;
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    }
    
    get complete() {
      return this._loaded || super.complete;
    }
  }
  
  global.Image = PDFCompatibleImage;
  global.window.Image = PDFCompatibleImage;
} catch (error) {
  console.warn('Canvas Image not available');
}

console.log(`Using React ${React.version} + ReactDOM ${ReactDOM.version}`);

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  customSnapshotsDir: `${__dirname}/tests/snapshots`,
  customDiffDir: `${__dirname}/tests/diffs`,
});

expect.extend({ toMatchImageSnapshot });