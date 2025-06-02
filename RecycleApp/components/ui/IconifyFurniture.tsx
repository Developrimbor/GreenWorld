import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Bu ikon: Material Design Icons'dan 'recycle' (mdi:recycle)
// https://icon-sets.iconify.design/mdi/recycle/

const IconifyFurnitureIcon = ({ width = 32, height = 32, color = '#4B9363', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none" {...props}>
    <Path d="M4 9a2 2 0 1 0-2 2v5h12v-5a2 2 0 1 0-2-2v2H4z M5.5 9a3.5 3.5 0 0 0-3.48-3.5a6 6 0 0 1 11.96 0A3.5 3.5 0 0 0 10.5 9v.5h-5z" fill={color}/>
  </Svg>
);

export default IconifyFurnitureIcon;