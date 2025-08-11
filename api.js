export const geoapifyUrl = 'https://api.geoapify.com/v1/';
export const apiKey = '9b262348ff6c411c8a475a8e60c292d8';

const rectFilter =
  'rect:36.95609802766853,-0.4018827204951094,36.968744199190496,-0.38934493481446';

export const searchLocation = async (query) => {
  const response = await fetch(
    `${geoapifyUrl}geocode/search?text=${encodeURIComponent(
      query
    )}&filter=${encodeURIComponent(rectFilter)}&response=json&apiKey=${apiKey}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch location data');
  }
  return response.json();
};
