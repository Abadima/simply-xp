## ChartOptions

### Properties

- `backgroundColor` (HexColor, optional): The background color of the chart.
- `limit` (number, optional): The limit of the chart.
- `type` (`"bar" | "line" | "pie" | "doughnut" | "radar" | "polarArea"`, optional): The type of the chart.

### Example

```typescript
export interface ChartOptions {
	backgroundColor?: HexColor;
	limit?: number;
	type?: "bar" | "line" | "pie" | "doughnut" | "radar" | "polarArea";
}
```