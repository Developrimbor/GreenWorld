import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Bu ikon: Material Design Icons'dan 'recycle' (mdi:recycle)
// https://icon-sets.iconify.design/mdi/recycle/

const IconifyGardenIcon = ({ width = 32, height = 32, color = '#4B9363', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="m15.1 1.81l-2.83 2.83c-.77.78-.77 2.05 0 2.83l1.41 1.41l-4.55 4.55l-2.82-2.83L4.89 12c-4.95 5-1.39 8.5-1.39 8.5S7 24 12 19.09l1.41-1.41l-2.8-2.8l4.54-4.54l1.39 1.39c.78.77 2.05.77 2.83 0L22.2 8.9zm2.83 8.47L16.55 8.9l-1.44-1.44l-1.4-1.4l1.41-1.41l4.23 4.23z" fill={color}/>
  </Svg>
);

export default IconifyGardenIcon;