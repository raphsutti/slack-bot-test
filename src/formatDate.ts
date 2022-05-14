// Format dates from yyyy-mm-dd to dd-mm
export const formatDate = (leave: string): string => {
  const array = leave.split("-").reverse();

  // Remove yyyy
  array.pop();

  // Format yyyy to yy
  // array[2] = array[2].substring(2);

  return array.join("/");
};
