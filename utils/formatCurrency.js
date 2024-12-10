const formatCurrency = (value) => {
  const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
  const formattedValue = formatter.format(value);

  // Replace dot with comma for thousands separator
  const formattedWithComma = formattedValue.replace(/\./g, ',');

  return formattedWithComma;
}

module.exports = { formatCurrency };
