const hugeicons = require('@hugeicons/react');
console.log('Available keys matching "target":', Object.keys(hugeicons).filter(k => k.toLowerCase().includes('target')));
console.log('Available keys start with "T":', Object.keys(hugeicons).filter(k => k.startsWith('T')).slice(0, 10));
