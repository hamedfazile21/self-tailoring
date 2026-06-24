tailwind css classes

button
  main button => 
    .button-main {
       @apply bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200;
    }


  second button =>
    .button-secondary {
      @apply bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition duration-200;
    } 

input
  input filed =>
    .input-field {
      @apply w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500;
    }

tables
  
  .table {
    @apply min-w-full divide-y divide-gray-200;
  }

  .table-thead {
    @apply bg-gray-100;
  }

  .table-thead th {
   @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
  }

  .table-tbody {
   @apply bg-white divide-y divide-gray-200;
  }

  .table-tbody tr {
   @apply whitespace-nowrap text-sm;
  }

  .table-tbody td {
   @apply px-6 py-4 whitespace-nowrap;
  }

