import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Bu ikon: Material Design Icons'dan 'recycle' (mdi:recycle)
// https://icon-sets.iconify.design/mdi/recycle/

const IconifyHomeAppliancesIcon = ({ width = 32, height = 32, color = '#4B9363', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M5.172 3.172C4 4.343 4 6.229 4 10v.75h16V10c0-3.771 0-5.657-1.172-6.828S15.771 2 12 2S6.343 2 5.172 3.172M17 6.25a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-1.5 0V7a.75.75 0 0 1 .75-.75m-13 6V13c0 3.771 0 5.657 1.172 6.828a3.1 3.1 0 0 0 1.078.697V22c0 .414.336.75.75.75h1a.75.75 0 0 0 .75-.75v-1.047C9.645 21 10.712 21 12 21s2.355 0 3.25-.047V22c0 .414.336.75.75.75h1a.75.75 0 0 0 .75-.75v-1.475a3.1 3.1 0 0 0 1.078-.697C20 18.657 20 16.771 20 13v-.75zm13 1a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 1 .75-.75" fill={color}/>
  </Svg>
  
);

export default IconifyHomeAppliancesIcon;