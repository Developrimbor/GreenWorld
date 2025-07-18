import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Bu ikon: Material Design Icons'dan 'recycle' (mdi:recycle)
// https://icon-sets.iconify.design/mdi/recycle/

const IconifyTireIcon = ({ width = 32, height = 32, color = '#4B9363', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="m19.66 9.64l-.36-.94l1.86-.7c-.92-2.12-2.56-3.82-4.62-4.86l-.8 1.78l-.92-.42l.8-1.8C14.5 2.26 13.28 2 12 2c-1.06 0-2.08.22-3.04.5l.68 1.84l-.94.36L8 2.84c-2.12.92-3.82 2.56-4.86 4.62l1.78.8l-.42.92l-1.8-.8C2.26 9.5 2 10.72 2 12c0 1.06.22 2.08.5 3.04l1.84-.68l.36.94l-1.86.7c.92 2.12 2.56 3.82 4.62 4.86l.8-1.78l.92.42l-.8 1.8c1.12.44 2.34.7 3.62.7c1.06 0 2.08-.22 3.04-.5l-.68-1.84l.94-.36l.7 1.86c2.12-.92 3.82-2.56 4.86-4.62l-1.78-.8l.42-.92l1.8.8c.44-1.12.7-2.34.7-3.62c0-1.06-.22-2.08-.5-3.04zm-5.36 7.9c-3.06 1.26-6.58-.18-7.84-3.24s.18-6.58 3.24-7.84s6.58.18 7.84 3.24a5.986 5.986 0 0 1-3.24 7.84" fill={color}/>
  </Svg>
);

export default IconifyTireIcon; 