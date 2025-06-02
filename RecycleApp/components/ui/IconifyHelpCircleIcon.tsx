import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Bu ikon: Material Design Icons'dan 'help-circle-outline' (mdi:help-circle-outline)
// https://icon-sets.iconify.design/mdi/help-circle-outline/

const IconifyHelpCircleIcon = ({ width = 24, height = 24, color = '#4B9363', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M12,2A10,10 0 1,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 1,1 20,12A8,8 0 0,1 12,20M11,17H13V15H11V17M12,7A3,3 0 0,1 15,10C15,11.31 13.83,12.42 12.5,13.09C12.18,13.24 12,13.58 12,13.93V14H14V13.93C14,13.07 14.5,12.29 15.29,11.91C16.08,11.53 17,10.84 17,10A5,5 0 0,0 12,5A5,5 0 0,0 7,10H9A3,3 0 0,1 12,7Z" fill={color}/>
  </Svg>
);

export default IconifyHelpCircleIcon; 