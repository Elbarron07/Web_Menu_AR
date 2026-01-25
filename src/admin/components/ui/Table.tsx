import type { ReactNode } from 'react';

interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  accessor?: (item: T) => string | number;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function Table<T extends { id?: string | number }>({ 
  columns, 
  data, 
  onRowClick,
  emptyMessage = 'Aucune donnée disponible'
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-12 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((item, index) => (
              <tr
                key={item.id || index}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render 
                      ? column.render(item)
                      : column.accessor
                      ? column.accessor(item)
                      : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
