export const getColorNameByHexCode = (
  hexCode: string,
  enumObject: any
): string | undefined => {
  const entry = Object.entries(enumObject).find(
    ([_, value]) => value === hexCode
  );
  return entry ? entry[0] : undefined;
};

export const getEnumKeyValueList = (
  enumObject: any
): { key: string; value: string }[] => {
  return Object.entries(enumObject).map(([key, value]) => ({
    key,
    value: value as string,
  }));
};

export const getEnumKeys = (enumObject: any): string[] => {
  return Object.keys(enumObject);
};

export const getValueByKey = (
  s: string,
  enumObject: any
): string | undefined => {
  // Check if the key exists in the enum
  if (s in enumObject) {
    return enumObject[s as keyof typeof enumObject];
  }
  return undefined;
};
