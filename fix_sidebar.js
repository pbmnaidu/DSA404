const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/components/ui/sidebar.tsx';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(
  'const { isMobile, state, openMobile, setOpenMobile } = useSidebar();',
  'const { isMobile, state, setOpen, openMobile, setOpenMobile } = useSidebar();\n    const [isHoverOpened, setIsHoverOpened] = React.useState(false);'
);

data = data.replace(
  'data-side={side}',
  'data-side={side}\n        onMouseEnter={() => {\n          if (state === "collapsed") {\n            setIsHoverOpened(true);\n            setOpen(true);\n          }\n        }}\n        onMouseLeave={() => {\n          if (isHoverOpened) {\n            setIsHoverOpened(false);\n            setOpen(false);\n          }\n        }}'
);

fs.writeFileSync(path, data);
console.log('Done modifying sidebar.tsx');
