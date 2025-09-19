package com.metro.ctl;

import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.metro.service.ModelService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class MetroController {

    private final ModelService modelService;

    public MetroController(ModelService modelService) {
        this.modelService = modelService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return modelService.health();
    }

    @GetMapping("/predict")
    public Map<String, Object> predict(@RequestParam(defaultValue = "test-input") String input) {
        return modelService.predict(input);
    }

     

    // @PostMapping("/schedule")
    @RequestMapping(value = "/schedule", method = {RequestMethod.GET, RequestMethod.POST})
    public Map<String, Object> schedule(@RequestParam(defaultValue = "demo-task") String taskName) {
        return modelService.schedule(taskName);
    }
}