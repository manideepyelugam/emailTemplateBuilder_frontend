export const fetchLayout = async (setElements) => {
    try {
      const response = await fetch('/api/getEmailLayout');
      const data = await response.json();
      setElements(data.elements || []);
    } catch (error) {
      console.error('Error fetching layout:', error);
    }
  };
  