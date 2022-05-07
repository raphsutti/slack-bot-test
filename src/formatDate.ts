export const formatDate = (leave: string): string => {
  const array = leave.split("-").reverse();

  array[2] = array[2].substring(2);

  return array.join("/");
};
