## ChartOptions

### Properties

- font `(string)`: The font to be used in the chart.
- limit `(2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)`: The maximum number of users to be displayed in the chart.
- theme `("blue" | "dark" | "discord" | "green" | "orange" | "red" | "space" | "yellow")`: The theme to be used in the chart.
- type `("bar" | "doughnut" | "pie")`: The type of chart to be created.

### Example

```typescript
export interface ChartOptions {
	font?: string;
	limit?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
	theme?: "blue" | "dark" | "discord" | "green" | "orange" | "red" | "space" | "yellow";
	type?: "bar" | "doughnut" | "pie";
}
```