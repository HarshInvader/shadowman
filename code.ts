// // This plugin will open a window to prompt the user to enter a number, and
// // it will then create that many rectangles on the screen.

// // This file holds the main code for plugins. Code in this file has access to
// // the *figma document* via the figma global object.
// // You can access browser APIs in the <script> tag inside "ui.html" which has a
// // full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// // This shows the HTML page in "ui.html".
// figma.showUI(__html__);

// // Calls to "parent.postMessage" from within the HTML page will trigger this
// // callback. The callback will be passed the "pluginMessage" property of the
// // posted message.
// figma.ui.onmessage = msg => {
//   // One way of distinguishing between different types of messages sent from
//   // your HTML page is to use an object with a "type" property like this.
//   if (msg.type === 'create-rectangles') {
//     const nodes: SceneNode[] = [];
//     for (let i = 0; i < msg.count; i++) {
//       const rect = figma.createRectangle();
//       rect.x = i * 150;
//       rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
//       figma.currentPage.appendChild(rect);
//       nodes.push(rect);
//     }
//     figma.currentPage.selection = nodes;
//     figma.viewport.scrollAndZoomIntoView(nodes);
//   }

//   // Make sure to close the plugin when you're done. Otherwise the plugin will
//   // keep running, which shows the cancel button at the bottom of the screen.
//   figma.closePlugin();
// };

// This plugin will open a window to prompt the user to enter a CSS shadow string,
// and it will then apply that shadow to the selected Figma nodes.

figma.showUI(__html__, { width: 400, height: 200 });

figma.ui.onmessage = msg => {
  if (msg.type === 'create-shadow') {
    const nodes = figma.currentPage.selection;
    if (nodes.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'No nodes selected' });
      return;
    }

    const shadowEffects = parseCSSShadowToEffects(msg.cssShadow);
    nodes.forEach((node: BaseNode) => {
      if ("effects" in node) {
        node.effects = shadowEffects;
      }
    });
  }

  figma.closePlugin();
};

function parseCSSShadowToEffects(cssShadow: string): Effect[] {
  const shadowArray = cssShadow.split(',').map(s => s.trim());
  const effects: Effect[] = [];

  for (const shadow of shadowArray) {
    const parts = shadow.split(' ');

    const inset = parts.indexOf('inset') !== -1;
    if (inset) {
      parts.splice(parts.indexOf('inset'), 1); // Remove 'inset' from parts
    }

    const colorString = parts.pop();
    if (!colorString) {
      continue;
    }
    const color = parseColor(colorString);

    const [offsetX, offsetY, blurRadius, spread] = parts.map(part => parseFloat(part) || 0);

    const effect: Effect = {
      type: inset ? 'INNER_SHADOW' : 'DROP_SHADOW',
      color: color,
      offset: { x: offsetX, y: offsetY },
      radius: blurRadius,
      spread: spread,
      visible: true,
      blendMode: 'NORMAL'
    };

    effects.push(effect);
  }

  return effects;
}

function parseColor(colorString: string): { r: number, g: number, b: number, a: number } {
  let rgba = { r: 0, g: 0, b: 0, a: 1 }; // Default to black color with full opacity

  if (colorString.startsWith('rgb')) {
    const rgbaMatch = colorString.match(/rgba?\(([^)]+)\)/);
    if (rgbaMatch) {
      const fullPart = rgbaMatch[1];
      const [rgbPart, alphaPart] = fullPart.split('/');
      const [r, g, b] = rgbPart.split(/[ ,]+/).map(str => parseFloat(str.trim()));
      let a = 1; // Default opacity

      if (alphaPart) {
        const alphaMatch = alphaPart.match(/([\d.]+)%?/);
        if (alphaMatch) {
          a = parseFloat(alphaMatch[1]);
          if (alphaMatch[0].includes('%')) {
            a = a / 100;
          }
        }
      }

      rgba = { r: r / 255, g: g / 255, b: b / 255, a: a };
    }
  } else if (colorString.toLowerCase() === 'white') {
    rgba = { r: 1, g: 1, b: 1, a: 1 };
  } else if (colorString.toLowerCase() === 'black') {
    rgba = { r: 0, g: 0, b: 0, a: 1 };
  }
  // Add more color formats as needed

  return rgba;
}


