var myApp = angular.module("myApp", ["ui.router"]);
var loginId;

myApp.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
  $urlRouterProvider.otherwise("/");

  $stateProvider
    .state("login", {
      url: "/login",
      templateUrl: "/login.html",
      controller: "loginController",
    })
    .state("todo", {
      url: "/todo",
      templateUrl: "/todo.html",
      controller: "todoController",
    })
    .state("/", {
      url: "/",
      templateUrl: "/register.html",
      controller: "registerController",
    })
    .state("register", {
      url: "/register",
      templateUrl: "/register.html",
      controller: "registerController",
    });

  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false,
  });
});

myApp.controller(
  "registerController",
  function ($scope, $http, $location, $window) {
    $scope.formData = {};

    $scope.submitForm = function () {
      var pass = $scope.formData.password;
      var confirmPass = $scope.formData.password2;

      var userData = {
        username: $scope.formData.name,
        email: $scope.formData.email,
        phoneno: $scope.formData.phno,
        password: $scope.formData.password,
        confirmPass: $scope.formData.password2,
      };

      if (pass === confirmPass) {
        $scope.formData = {};

        $http
          .post("http://10.21.81.151:8000/api/register/", userData)
          .then(function (response) {
            var register = response.data;
            console.log(register);
            $location.path("/login");
          })
          .catch(function (error) {
            if (error.data && error.data.message) {
              $window.alert(error.data.message);
            } else {
              $window.alert("An error occured. Please try again");
            }
          });
      } else {
        $window.alert("Password does not match");
      }
    };
  }
);

myApp.controller(
  "loginController",
  function ($scope, $http, $location, $window) {
    $scope.loginData = {};

    $scope.submitLoginForm = function () {
      var userLogin = {
        email: $scope.loginData.email,
        password: $scope.loginData.password,
      };

      $scope.loginData = {};

      $http
        .post("http://10.21.81.151:8000/api/login/", userLogin)
        .then(function (response) {
          var register = response.data;
          loginId = register.id;
          console.log(loginId);
          $location.path("/todo");
        })
        .catch(function (error) {
          if (error.data && error.data.message) {
            $window.alert(error.data.message);
          } else {
            $window.alert("An error occured. Please try again");
          }
        });
    };
  }
);

myApp.controller("todoController", function ($scope, $http, $window) {
  var apiUrl = "http://10.21.81.151:8000/api/todo/";

  var Params = { loginid : loginId.toString() };
  console.log(Params);

  $http.get(apiUrl, { params: Params }).then(function (response) {
    var register = response;
    $scope.todolist = response.data;
    console.log(register);
    $scope.displayTasks();
  });

  $scope.logOut = function ($location) {
    $http
      .post("http://10.21.81.151:8000/api/logout/", { loginid: loginId })
      .then(function (response) {
        var register = response.data.message;
        console.log(register);
        $location.path("/login");
      });
  };

  $scope.displayTasks = function () {
    $scope.todolist.forEach(function (task) {
      task.editMode = false;
    });

    $scope.filteredTasks = $scope.todolist.filter(function (task) {
      return (
        task.status === false ||
        task.status === "false" ||
        task.status === "true" ||
        task.status === true
      );
    });
  };

  $scope.addTask = function () {
    if (!$scope.task) {
      $window.alert("Enter task");
      return;
    }
    var newTask = { taskText: $scope.task, status: false, id: loginId };

    $http.post(apiUrl, newTask).then(function (response) {
      $scope.todolist.push(response.data);
      $scope.task = "";
      $scope.displayTasks();
    });
  };

  $scope.delete = function () {
    var deletedTasks = [];
    angular.forEach($scope.todolist, function (task) {
      if (task.status) {
        if (task.status != "completed") {
          task.status = "deleted";
          $http.put(apiUrl + task.id, task);
        }
      }
      deletedTasks.push(task);
    });
    $scope.todolist = deletedTasks;
    $scope.displayTasks();
  };

  $scope.complete = function () {
    var completedTasks = [];
    angular.forEach($scope.todolist, function (task) {
      if (task.status) {
        if (task.status != "deleted") {
          task.status = "completed";
          $http.put(apiUrl + task.id, task);
        }
      }
      completedTasks.push(task);
    });
    $scope.todolist = completedTasks;
    $scope.displayTasks();
  };

  $scope.toggleStatus = function (task) {
    task.status = !task.status;
    if (task.status) {
      task.checkedTime = new Date().toLocaleString();
    } else {
      task.checkedTime = "";
    }
    $http.put(apiUrl + task.id);
  };

  $scope.edit = function (task) {
    task.editMode = true;
    if (task.updatedText) {
      task.taskText = task.updatedText;
      $http.put(apiUrl + task.id, task);
    }
    $scope.displayTasks();
  };
});
