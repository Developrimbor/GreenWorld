import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Bu ikon: Material Design Icons'dan 'recycle' (mdi:recycle)
// https://icon-sets.iconify.design/mdi/recycle/

const IconifyMaskIcon = ({ width = 32, height = 32, color = '#4B9363', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M20.25 6c-1.46 0-2.64 1.14-2.75 2.58l-4.95-1.42c-.36-.11-.74-.11-1.1 0L6.5 8.58C6.39 7.14 5.21 6 3.75 6C2.23 6 1 7.23 1 8.75v3.5C1 13.77 2.23 15 3.75 15h1.93c1.13 2.36 3.53 4 6.32 4s5.19-1.64 6.32-4h1.93c1.52 0 2.75-1.23 2.75-2.75v-3.5C23 7.23 21.77 6 20.25 6M5 13.5H3.75c-.69 0-1.25-.56-1.25-1.25v-3.5a1.25 1.25 0 0 1 2.5 0zM15 12l-2.6-.7c-.3-.1-.6-.1-.8 0L9 12v-1l2.3-.7c.4-.1.9-.1 1.4 0l2.3.7zm6.5.25c0 .69-.56 1.25-1.25 1.25H19V8.75a1.25 1.25 0 0 1 2.5 0z" fill={color}/>
  </Svg>
);

export default IconifyMaskIcon;