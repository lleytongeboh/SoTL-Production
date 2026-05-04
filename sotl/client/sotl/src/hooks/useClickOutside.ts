import { useEffect } from 'react';

/**
 * Example usage: Closing a dropdown or modal
 * 
 * const ref = useRef(null);
 * useClickOutside(ref, () => {
 *   console.log('Clicked outside');
 * });
 * 
 * return (
 *   <div ref={ref}>
 *     Click outside this element
 *   </div>
 * );
 * 
 * @param ref The ref of the element to detect clicks outside of.
 * @param handler The function to call when a click outside is detected.
 */

function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

export default useClickOutside;
