import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Bu ikon: Material Design Icons'dan 'recycle' (mdi:recycle)
// https://icon-sets.iconify.design/mdi/recycle/

const IconifyBiomedicalIcon = ({ width = 32, height = 32, color = '#4B9363', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none" {...props}>
    <Path d="M37.084 15.735a1 1 0 1 0 .448-1.949l-6.616-1.52a1 1 0 1 0-.448 1.948z M34 22a8 8 0 1 0 0-16a8 8 0 0 0 0 16m0-2a6 6 0 1 0 0-12a6 6 0 0 0 0 12M16.778 9.245c-.647-1.532-2.813-1.686-3.682-.263L6.292 20.115c-.785 1.284.092 2.924 1.623 3.033l11.866.846c1.53.11 2.644-1.388 2.06-2.77zm-1.967.768l-.009.012L8.01 21.14l.002.002l.01.004a.1.1 0 0 0 .036.007l11.867.846h.038a.1.1 0 0 0 .029-.015l-5.056-11.96l-.004-.01a.1.1 0 0 0-.054-.014a.13.13 0 0 0-.062.009l-.003.001v.001zM35.385 36.36a6 6 0 0 0-5.071-10.876l-10.876 5.07a6 6 0 1 0 5.071 10.877zm-15.102-3.992a4 4 0 1 0 3.381 7.25l4.466-2.083l-3.38-7.25zm9.66 4.322l-3.381-7.25l4.597-2.144a4 4 0 1 1 3.38 7.25z" fill={color}/>
  </Svg>
  
);

export default IconifyBiomedicalIcon;