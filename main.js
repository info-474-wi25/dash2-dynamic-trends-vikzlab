// 1. SET GLOBAL VARIABLES FOR SIZE
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// 2. CREATE SVG CONTAINERS FOR BOTH CHARTS
const svg1 = d3.select("#lineChart1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const svg2 = d3.select("#lineChart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// 3. SIMPLE TOOLTIP (LIGHTER BACKGROUND)
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("pointer-events", "none");

// 4. LOAD AND TRANSFORM DATA
d3.csv("weather.csv").then(data => {
  // Convert columns to proper types
  data.forEach(d => {
    d.date = new Date(d.date);
    d.actual_mean_temp_num = +d.actual_mean_temp;
    d.average_max_temp_num = +d.average_max_temp;
    d.actual_precip_num = +d.actual_precipitation;
    d.average_precip_num = +d.average_precipitation;
  });

  // FILTER FOR INDIANAPOLIS
  const indyData = data.filter(d => d.city === "Indianapolis");
  indyData.sort((a, b) => a.date - b.date);

  // MONTHLY GROUPING
  const monthlyData = Array.from(
      d3.group(indyData, d => {
          const year = d.date.getFullYear();
          const month = d.date.getMonth();
          return `${year}-${month}`;
      }),
      ([key, values]) => {
          const [year, month] = key.split("-").map(Number);
          return {
              month: new Date(year, month, 1),
              actual_avg: d3.mean(values, d => d.actual_precip_num),
              average_avg: d3.mean(values, d => d.average_precip_num)
          };
      }
  );
  monthlyData.sort((a, b) => a.month - b.month);

  //--------------------------
  // CHART 1: TEMPERATURE
  //--------------------------
  const xScale1 = d3.scaleTime()
      .domain(d3.extent(indyData, d => d.date))
      .range([0, width]);

  const yScale1 = d3.scaleLinear()
      .domain([
          d3.min(indyData, d => Math.min(d.actual_mean_temp_num, d.average_max_temp_num)) - 5,
          d3.max(indyData, d => Math.max(d.actual_mean_temp_num, d.average_max_temp_num)) + 5
      ])
      .range([height, 0]);

  svg1.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale1)
          .ticks(d3.timeMonth.every(2))
          .tickFormat(d3.timeFormat("%b %Y")))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

  svg1.append("g").call(d3.axisLeft(yScale1));

  const line1 = d3.line()
      .x(d => xScale1(d.date))
      .y(d => yScale1(d.actual_mean_temp_num))
      .curve(d3.curveMonotoneX);

  const line2 = d3.line()
      .x(d => xScale1(d.date))
      .y(d => yScale1(d.average_max_temp_num))
      .curve(d3.curveMonotoneX);

  svg1.append("path")
      .datum(indyData)
      .attr("class", "actualTempLine")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line1);

  svg1.append("path")
      .datum(indyData)
      .attr("class", "avgTempLine")
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1.5)
      .attr("d", line2);

  svg1.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")

  svg1.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Temperature (°F)");

  // Chart 1 Legend
  const legend1 = svg1.append("g")
      .attr("transform", `translate(${width - 230}, 0)`);

  const legend1Entries = legend1.selectAll("g")
      .data([
          ["Actual Mean Temp", "steelblue"],
          ["Average Max Temp", "red"]
      ])
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legend1Entries.append("rect")
      .attr("x", 0)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", d => d[1]);

  legend1Entries.append("text")
      .attr("x", 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .style("text-anchor", "start")
      .text(d => d[0]);

  // Tooltip for Chart 1
  const focus1 = svg1.append("g")
      .attr("class", "focus")
      .style("display", "none");

  focus1.append("circle")
      .attr("r", 5)
      .attr("fill", "steelblue");

  focus1.append("rect")
      .attr("class", "tooltip-box")
      .attr("width", 120)
      .attr("height", 50)
      .attr("x", 10)
      .attr("y", -22)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", "white")
      .attr("stroke", "#ddd")
      .attr("opacity", 0.9);

  focus1.append("text")
      .attr("class", "tooltip-date")
      .attr("x", 18)
      .attr("y", -2);

  focus1.append("text")
      .attr("x", 18)
      .attr("y", 18)
      .text("Temp:");

  focus1.append("text")
      .attr("class", "tooltip-temp")
      .attr("x", 60)
      .attr("y", 18);

  svg1.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .style("opacity", 0)
      .on("mouseover", () => focus1.style("display", null))
      .on("mouseout", () => focus1.style("display", "none"))
      .on("mousemove", mousemove1);

  function mousemove1(event) {
    const bisect = d3.bisector(d => d.date).left;
    const x0 = xScale1.invert(d3.pointer(event)[0]);
    const i = bisect(indyData, x0, 1);
    const d0 = indyData[i - 1];
    const d1 = indyData[i];
    const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    focus1.attr("transform", `translate(${xScale1(d.date)},${yScale1(d.actual_mean_temp_num)})`);
    focus1.select(".tooltip-date").text(d.date.toLocaleDateString());
    focus1.select(".tooltip-temp").text(`${d.actual_mean_temp_num}°F`);
  }

  //--------------------------
  // CHART 2: PRECIPITATION
  //--------------------------
  let xDomain2 = d3.extent(monthlyData, d => d.month);
  xDomain2[0] = d3.timeMonth.offset(xDomain2[0], -1);
  xDomain2[1] = d3.timeMonth.offset(xDomain2[1], 1);

  const xScale2 = d3.scaleTime()
      .domain(xDomain2)
      .range([0, width]);

  const yScale2 = d3.scaleLinear()
      .domain([
          0,
          d3.max(monthlyData, d => Math.max(d.actual_avg, d.average_avg)) * 1.1
      ])
      .range([height, 0]);

  svg2.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale2)
          .ticks(d3.timeMonth.every(2))
          .tickFormat(d3.timeFormat("%b %Y")))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

  svg2.append("g").call(d3.axisLeft(yScale2));

  const barWidth = (width / monthlyData.length) * 0.4;

  svg2.selectAll(".bar-actual")
      .data(monthlyData)
      .enter()
      .append("rect")
      .attr("class", "bar-actual")
      .attr("x", d => xScale2(d.month) - barWidth - 2)
      .attr("y", d => yScale2(d.actual_avg))
      .attr("width", barWidth)
      .attr("height", d => height - yScale2(d.actual_avg))
      .attr("fill", "red")
      .on("mouseover", function(event, d) {
          tooltip.style("opacity", 0.9)
              .html(`
                  <strong>Month:</strong> ${d3.timeFormat("%b %Y")(d.month)}<br>
                  <strong>Actual Avg:</strong> ${d.actual_avg.toFixed(2)} in
              `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

  svg2.selectAll(".bar-avg")
      .data(monthlyData)
      .enter()
      .append("rect")
      .attr("class", "bar-avg")
      .attr("x", d => xScale2(d.month) + 2)
      .attr("y", d => yScale2(d.average_avg))
      .attr("width", barWidth)
      .attr("height", d => height - yScale2(d.average_avg))
      .attr("fill", "steelblue")
      .on("mouseover", function(event, d) {
          tooltip.style("opacity", 0.9)
              .html(`
                  <strong>Month:</strong> ${d3.timeFormat("%b %Y")(d.month)}<br>
                  <strong>Historical Avg:</strong> ${d.average_avg.toFixed(2)} in
              `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

  svg2.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")


  svg2.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Precipitation (inches)");

  // Chart 2 Legend
  const legend2 = svg2.append("g")
      .attr("transform", `translate(${width - 275}, 0)`);

  const legend2Entries = legend2.selectAll("g")
      .data([
          ["Actual Monthly Avg", "red"],
          ["Historical Monthly Avg", "steelblue"]
      ])
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legend2Entries.append("rect")
      .attr("x", 0)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", d => d[1]);

  legend2Entries.append("text")
      .attr("x", 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .style("text-anchor", "start")
      .text(d => d[0]);

  // ---------------------------
  // 5. ADD TOGGLING INTERACTIVITY
  // (Same as before, just referencing checkboxes in HTML)
  // ---------------------------
  d3.select("#toggleActualTemp").on("change", function() {
    if (this.checked) {
      svg1.select(".actualTempLine").style("display", "block");
    } else {
      svg1.select(".actualTempLine").style("display", "none");
    }
  });

  d3.select("#toggleAvgTemp").on("change", function() {
    if (this.checked) {
      svg1.select(".avgTempLine").style("display", "block");
    } else {
      svg1.select(".avgTempLine").style("display", "none");
    }
  });

  d3.select("#toggleActualPrecip").on("change", function() {
    if (this.checked) {
      svg2.selectAll(".bar-actual").style("display", "block");
    } else {
      svg2.selectAll(".bar-actual").style("display", "none");
    }
  });

  d3.select("#toggleHistoricalPrecip").on("change", function() {
    if (this.checked) {
      svg2.selectAll(".bar-avg").style("display", "block");
    } else {
      svg2.selectAll(".bar-avg").style("display", "none");
    }
  });
});
