import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Bu ikon: Material Design Icons'dan 'recycle' (mdi:recycle)
// https://icon-sets.iconify.design/mdi/recycle/

const IconifyExampleIcon = ({ width = 32, height = 32, color = '#4B9363', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 15 15" fill="none" {...props}>
    <Path d="M13.5 11h-1.8L8.2.5C8-.2 7-.2 6.8.5L3.3 11H1.5c-.3 0-.5.2-.5.5v1c0 .3.2.5.5.5h12c.3 0 .5-.2.5-.5v-1c0-.3-.2-.5-.5-.5M7 3h1l.7 2H6.4zM5.7 7h3.6l.7 2H5z" fill={color}/>
  </Svg>
  
);

export default IconifyExampleIcon;