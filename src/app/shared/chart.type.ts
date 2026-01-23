import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexPlotOptions,
  ApexResponsive,
  ApexLegend,
  ApexTheme,
} from 'ng-apexcharts';

export type DonutOpts = {
  series: number[];
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  legend: ApexLegend;
  theme?: ApexTheme;
};

export type PieOpts = {
  series: number[];
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  legend: ApexLegend;
  theme?: ApexTheme;
};

export type BarOpts = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  theme?: ApexTheme;
  tooltip?: any;
  yaxis?: any;
};

export type AreaOpts = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  stroke: any;
  fill: any;
  tooltip: any;
  colors?: any[];
  legend?: ApexLegend;
  plotOptions?: ApexPlotOptions;
  theme?: ApexTheme;
};
