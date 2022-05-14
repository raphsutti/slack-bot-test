// Format dates from yyyy-mm-dd to dd-mm or dd-mm-yy
export const formatDate = (leave: string, withYear = false) => {
  const array = leave.split("-").reverse();

  if (withYear) {
    // Format yyyy to yy
    array[2] = array[2].substring(2);
    return array.join("/");
  }

  // Remove yyyy
  array.pop();

  return array.join("/");
};
