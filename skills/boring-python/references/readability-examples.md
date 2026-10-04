# Readability examples

These are illustrative domain rules, not requirements to add to the user's application. Preserve the actual application's behavior during a readability refactor.

## Whitespace as paragraphs

This function has clear names, but its steps run together:

```python
def reserve_stock(stock_available: int, quantity_requested: int) -> int:
    if quantity_requested <= 0:
        raise ValueError("Quantity must be positive")
    if quantity_requested > stock_available:
        raise ValueError("Insufficient stock")
    stock_remaining = stock_available - quantity_requested
    return stock_remaining
```

Give each guard clause room, then keep the calculation and its return together:

```python
def reserve_stock(stock_available: int, quantity_requested: int) -> int:
    if quantity_requested <= 0:
        raise ValueError("Quantity must be positive")

    if quantity_requested > stock_available:
        raise ValueError("Insufficient stock")

    stock_remaining = stock_available - quantity_requested
    return stock_remaining
```

There is no blank line between an `if` and its `raise`, or between computing the result and returning it. A blank line before every statement would erase the grouping just as surely as using none. A direct `return stock_available - quantity_requested` is also reasonable; the intermediate variable here illustrates grouping, not a requirement to name every expression.

Keep a value with the check that immediately uses it:

```python
quantity = int(quantity_text)
if quantity < 0:
    raise ValueError("Quantity must be nonnegative")

record = InventoryRecord(product_id=product_id, quantity=quantity)
records.append(record)
```

Keep a short call compact. If arguments need more space, wrap predictably instead of manually lining them up in columns:

```python
shipment = create_shipment(
    warehouse_id=warehouse_id,
    destination_address=destination_address,
    delivery_instructions=delivery_instructions,
)
```

Whitespace changes presentation, not behavior. Preserve indentation that determines control flow and whitespace that belongs to string data.

## Replace explanations with names

Avoid a comment that forces the reader to translate identifiers:

```python
# Retry only when attempts remain and the failure is temporary.
if n < m and t:
    retry_request()
```

Prefer names that already communicate the decision:

```python
if attempt_count < attempt_count_max and is_temporary_failure:
    retry_request()
```

Do not mechanically expand this clear condition into several layers of nested branches. The goal is readability, not extra lines.

## Replace narration with code

Avoid:

```python
# Initialize the collection.
active_users = []

# Iterate over the users.
for user in users:
    # Check whether the user is active.
    if user.is_active:
        # Add the active user.
        active_users.append(user)
```

Prefer:

```python
active_users = []

for user in users:
    if user.is_active:
        active_users.append(user)
```

## Preserve a reason the code cannot express

For an application whose documented legacy consumer requires input order:

```python
# The legacy importer matches rows by position; sorting would attach stock to the wrong product.
write_inventory(records)
```

Keep that constraint. Renaming the function to `write_inventory_without_sorting_because_legacy_importer_matches_positions` would make the code worse. In real code, cite the known specification or issue when available. Do not add this comment unless the constraint is true.

## Helpers must earn the jump

This helper adds a name without adding a useful concept:

```python
def _has_records(records: list[str]) -> bool:
    return len(records) > 0


def print_records(records: list[str]) -> None:
    if not _has_records(records):
        return

    for record in records:
        print(record)
```

In this example even the guard is unnecessary: the loop already handles an empty list. Keep the operation direct:

```python
def print_records(records: list[str]) -> None:
    for record in records:
        print(record)
```

But short functions are not inherently bad. Suppose an application has a shared lifecycle rule: completed and cancelled jobs are terminal, while failed jobs remain retryable. Several operations need exactly that rule:

```python
def is_terminal_status(status: str) -> bool:
    return status in ("completed", "cancelled")
```

This helper names a domain policy and provides one place to maintain it. It is useful even though its body is one line. If the application already has a status enum, use that type rather than introducing a parallel string model. Do not add these lifecycle rules to applications where they are not true.

Before extracting, identify what the helper lets the caller stop thinking about. A parser can hide field conversion and validation. A policy function can hide the definition of a domain state. `_has_records` hides only a familiar expression.

Keep similarly shaped but different rules separate. Customer identifiers and promotional codes might both currently use `.strip().lower()`, but they can have different normalization policies. That resemblance alone does not justify a shared `normalize_text` utility.

When extracting the inventory parser below, keep duplicate detection in the loader: uniqueness belongs to the file, not a single record. Keep opening and closing the file in the same visible `with` block. Helpers should reduce the information a caller must track, not split that information across shared state.

## A cohesive longer function can stay together

This complete example reads an inventory file. Its contract is strict: the header must match, product identifiers must be nonempty and unique after trimming, and quantities must be nonnegative integers accepted by `int()`. It retains input order and permits an empty inventory after the header.

The function owns one operation and keeps its state local. Its length does not by itself justify splitting it.

```python
import csv
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class InventoryRecord:
    product_id: str
    quantity: int


def load_inventory(path: Path) -> list[InventoryRecord]:
    records: list[InventoryRecord] = []
    product_ids_seen: set[str] = set()

    with path.open(encoding="utf-8", newline="") as inventory_file:
        reader = csv.reader(inventory_file)
        header = next(reader, None)

        if header != ["product_id", "quantity"]:
            raise ValueError("Expected product_id,quantity header")

        for row in reader:
            line_number = reader.line_num

            if len(row) != 2:
                raise ValueError(f"Line {line_number}: expected two fields")

            product_id = row[0].strip()
            quantity_text = row[1].strip()

            if product_id == "":
                raise ValueError(f"Line {line_number}: product_id is required")

            try:
                quantity = int(quantity_text)
            except ValueError as error:
                raise ValueError(f"Line {line_number}: quantity must be an integer") from error

            if quantity < 0:
                raise ValueError(f"Line {line_number}: quantity must be nonnegative")

            if product_id in product_ids_seen:
                raise ValueError(f"Line {line_number}: duplicate product_id {product_id}")

            record = InventoryRecord(product_id=product_id, quantity=quantity)
            records.append(record)
            product_ids_seen.add(product_id)

    return records
```

There are no comments announcing opening, validating, or appending. The statements already say that. `reader.line_num` reports the physical line where the CSV record ends, including records containing quoted newlines.

## Extract a meaningful operation when it earns its place

If record parsing grows, is reused, or needs to be understood independently, separate the per-record contract from the file-level contract. The helper owns field validation. The parent owns the header, file lifetime, duplicate detection, and output ordering. The shared imports and `InventoryRecord` definition above stay unchanged.

```python
def parse_inventory_record(row: list[str], line_number: int) -> InventoryRecord:
    if len(row) != 2:
        raise ValueError(f"Line {line_number}: expected two fields")

    product_id = row[0].strip()
    quantity_text = row[1].strip()

    if product_id == "":
        raise ValueError(f"Line {line_number}: product_id is required")

    try:
        quantity = int(quantity_text)
    except ValueError as error:
        raise ValueError(f"Line {line_number}: quantity must be an integer") from error

    if quantity < 0:
        raise ValueError(f"Line {line_number}: quantity must be nonnegative")

    return InventoryRecord(product_id=product_id, quantity=quantity)


def load_inventory(path: Path) -> list[InventoryRecord]:
    records: list[InventoryRecord] = []
    product_ids_seen: set[str] = set()

    with path.open(encoding="utf-8", newline="") as inventory_file:
        reader = csv.reader(inventory_file)
        header = next(reader, None)

        if header != ["product_id", "quantity"]:
            raise ValueError("Expected product_id,quantity header")

        for row in reader:
            record = parse_inventory_record(row, line_number=reader.line_num)

            if record.product_id in product_ids_seen:
                raise ValueError(f"Line {reader.line_num}: duplicate product_id {record.product_id}")

            records.append(record)
            product_ids_seen.add(record.product_id)

    return records
```

Both versions have the same validation order, errors, and outputs. Do not add the helper merely to increase the function count. If private and specific to loading, `_load_inventory_parse_record` is also an appropriate name; do not claim it is reusable unless it actually is.

## Small functions can obscure a simple operation

Avoid replacing the loader with opaque state-passing stages:

```python
def load_inventory(path: Path) -> list[InventoryRecord]:
    context = create_context(path)
    open_input(context)
    check_input(context)
    process_rows(context)
    close_input(context)
    return get_records(context)
```

The short caller conceals ownership, failure handling, and state changes. It also loses guaranteed cleanup when a middle step raises. Keep the `with` block visible, use concrete values, and extract only boundaries that clarify the operation.

## Docstrings should add a caller contract

`"""Load inventory from a path."""` adds little to `load_inventory(path)`.

A useful docstring for this public loader could instead say:

```text
Read UTF-8 CSV records in file order, trimming whitespace from both fields.

Require the exact product_id,quantity header. Product identifiers must be
nonempty and unique after trimming. Quantities must be nonnegative integers
accepted by int(). Raise ValueError for invalid records; filesystem and CSV
parser errors propagate. Report record-ending physical line numbers in
record errors. A header with no records produces an empty list.
```

Keep this detail when callers need the contract. Do not copy it into every internal helper or use it as an excuse to leave the implementation obscure.
