import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Bu ikon: Material Design Icons'dan 'recycle' (mdi:recycle)
// https://icon-sets.iconify.design/mdi/recycle/

const IconifyDeadAnimalsIcon = ({ width = 32, height = 32, color = '#4B9363', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M6.25 5.25c0-1.422 1.028-2.75 2.5-2.75s2.5 1.328 2.5 2.75S10.222 8 8.75 8s-2.5-1.328-2.5-2.75M1 8.75C1 7.328 2.028 6 3.5 6S6 7.328 6 8.75S4.972 11.5 3.5 11.5S1 10.172 1 8.75M12 10a7 7 0 0 0-7 7c0 1.36.72 2.388 1.7 3.044c.963.645 2.198.956 3.378.956h3.844c1.18 0 2.415-.311 3.377-.956C18.28 19.388 19 18.361 19 17a7 7 0 0 0-7-7m.75-4.75c0-1.422 1.028-2.75 2.5-2.75s2.5 1.328 2.5 2.75S16.722 8 15.25 8s-2.5-1.328-2.5-2.75M18 8.75C18 7.328 19.028 6 20.5 6S23 7.328 23 8.75s-1.028 2.75-2.5 2.75S18 10.172 18 8.75" fill={color}/>
  </Svg>
);

export default IconifyDeadAnimalsIcon;