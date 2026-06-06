import { useState } from 'react';

const StarRating = ({ value = 0, onChange, readOnly = false, size = 'md' }) => {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;
  const sizeClass = size === 'lg' ? 'stars-lg' : size === 'sm' ? 'stars-sm' : '';

  return (
    <div className={`stars ${readOnly ? 'stars-static' : ''} ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`star${display >= n ? ' filled' : ''}${!readOnly && hovered === n ? ' hover' : ''}`}
          onClick={() => !readOnly && onChange?.(n)}
          onMouseEnter={() => !readOnly && setHovered(n)}
          onMouseLeave={() => !readOnly && setHovered(null)}
          title={readOnly ? `${value}/5` : `Rate ${n}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;
